"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Define the schema for validation
const itemSchema = z.object({
  name: z.string().min(1, "Name is required."),
  imageUrlFront: z.string().url("Front image is required."),
  imageUrlBack: z.string().url("Back image is required."),
  brand: z.string().optional(),
  type: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  price: z.preprocess(
    (a) => (String(a) === "" ? undefined : parseFloat(String(a))),
    z.number().positive().optional()
  ),
  datePurchased: z.preprocess(
    (a) => (String(a) === "" ? undefined : new Date(String(a))),
    z.date().optional()
  ),
  size: z.string().optional(),
});

type ItemFieldErrors = Record<string, string[] | undefined>;

type ClothActionResponse = {
  success: boolean;
  message: string;
  fieldErrors?: ItemFieldErrors;
};

const updateItemSchema = z.object({
  name: z.string().min(1, "Name is required.").optional(),
  brand: z.union([z.string(), z.null()]).optional(),
  type: z.union([z.string(), z.null()]).optional(),
  color: z.union([z.string(), z.null()]).optional(),
  description: z.union([z.string(), z.null()]).optional(),
  size: z.union([z.string(), z.null()]).optional(),
  imageUrlFront: z.string().url("Front image must be a valid URL.").optional(),
  imageUrlBack: z.string().url("Back image must be a valid URL.").optional(),
  price: z
    .preprocess((value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
      return Number.isNaN(parsed) ? NaN : parsed;
    }, z.number().positive().nullable().optional()),
  datePurchased: z.preprocess((value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const date = typeof value === "string" ? new Date(value) : (value as Date);
    return Number.isNaN(date.getTime()) ? null : date;
  }, z.date().nullable().optional()),
});

// This is the initial state for our useActionState hook
type ClothingItemState = { message: string; errors: Record<string, string[] | undefined> };

export async function createClothingItem(
  prevState: ClothingItemState,
  formData: FormData
): Promise<ClothingItemState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { message: "Unauthorized", errors: {} };
  }

  // Convert FormData to a plain object
  const rawData = Object.fromEntries(formData.entries());

  // Validate the data
  const validatedFields = itemSchema.safeParse(rawData);

  // If validation fails, return errors
  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    return {
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // If validation succeeds, save to database
  try {
    await prisma.clothingItem.create({
      data: {
        ...validatedFields.data,
        userId: session.user.id,
      },
    });

    return { message: "Success", errors: {} };
  } catch (error) {
    console.error("Failed to create item", error);
    return {
      message: "Failed to save item to database.",
      errors: {},
    };
  }
}

export async function getClothingItems() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return [];
  }

  try {
    const items = await prisma.clothingItem.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return items;
  } catch (error) {
    console.error("Failed to fetch clothing items", error);
    return [];
  }
}

export async function updateClothingItem({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
}): Promise<ClothActionResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  const item = await prisma.clothingItem.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!item) {
    return {
      success: false,
      message: "Item not found.",
    };
  }

  const validatedFields = updateItemSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { datePurchased, ...rest } = validatedFields.data;

  try {
    await prisma.clothingItem.update({
      where: { id },
      data: {
        ...rest,
        datePurchased: datePurchased ?? null,
      },
    });

    return {
      success: true,
      message: "Item updated successfully.",
    };
  } catch (error) {
    console.error("Failed to update item", error);
    return {
      success: false,
      message: "Failed to update item.",
    };
  }
}

export async function deleteClothingItem(id: string): Promise<ClothActionResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  const item = await prisma.clothingItem.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!item) {
    return {
      success: false,
      message: "Item not found.",
    };
  }

  try {
    await prisma.clothingItem.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Item deleted successfully.",
    };
  } catch (error) {
    console.error("Failed to delete item", error);
    return {
      success: false,
      message: "Failed to delete item.",
    };
  }
}

export async function toggleCapsule(id: string): Promise<ClothActionResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  const item = await prisma.clothingItem.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!item) {
    return {
      success: false,
      message: "Item not found.",
    };
  }

  try {
    await prisma.clothingItem.update({
      where: { id },
      data: {
        inCapsule: !item.inCapsule,
      },
    });

    return {
      success: true,
      message: item.inCapsule
        ? "Item removed from capsule."
        : "Item added to capsule.",
    };
  } catch (error) {
    console.error("Failed to toggle capsule status", error);
    return {
      success: false,
      message: "Failed to update item.",
    };
  }
}
