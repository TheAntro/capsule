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
