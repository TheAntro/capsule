"use client";

import { useEffect, useState } from "react";
import { deleteClothingItem, updateClothingItem } from "@/actions/clothing";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ClothingItemWithDetails } from "./types";

type FormState = {
  name: string;
  brand: string;
  type: string;
  color: string;
  description: string;
  price: string;
  datePurchased: string;
  size: string;
};

const emptyFormState: FormState = {
  name: "",
  brand: "",
  type: "",
  color: "",
  description: "",
  price: "",
  datePurchased: "",
  size: "",
};

type EditClothingItemDialogProps = {
  open: boolean;
  item: ClothingItemWithDetails | null;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => Promise<void> | void;
  onDeleted?: () => Promise<void> | void;
};

const toDateInputValue = (value: string | Date | null) => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

export default function EditClothingItemDialog({
  open,
  item,
  onOpenChange,
  onUpdated,
  onDeleted,
}: EditClothingItemDialogProps) {
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const hasItem = Boolean(item);

  useEffect(() => {
    if (!item) {
      setFormState(emptyFormState);
      setFieldErrors({});
      setFormError(null);
      return;
    }

    setFormState({
      name: item.name ?? "",
      brand: item.brand ?? "",
      type: item.type ?? "",
      color: item.color ?? "",
      description: item.description ?? "",
      price: item.price != null ? String(item.price) : "",
      datePurchased: toDateInputValue(item.datePurchased),
      size: item.size ?? "",
    });
    setFieldErrors({});
    setFormError(null);
  }, [item]);

  useEffect(() => {
    if (!open) {
      setDeleteDialogOpen(false);
    }
  }, [open]);

  const handleInputChange = (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item) return;

    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);

    const payload = {
      name: formState.name.trim(),
      brand: formState.brand.trim() || null,
      type: formState.type.trim() || null,
      color: formState.color.trim() || null,
      description: formState.description.trim() || null,
      size: formState.size.trim() || null,
      price: formState.price ? Number(formState.price) : null,
      datePurchased: formState.datePurchased || null,
    };

    const response = await updateClothingItem({
      id: item.id,
      data: payload,
    });

    setIsSaving(false);

    if (!response.success) {
      if (response.fieldErrors) {
        setFieldErrors(response.fieldErrors);
      }
      setFormError(response.message);
      toast.error("Update failed", {
        description: response.message,
      });
      return;
    }

    toast.success("Item updated", {
      description: response.message,
    });

    if (onUpdated) {
      await onUpdated();
    }

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!item) return;
    setIsDeleting(true);

    const response = await deleteClothingItem(item.id);

    setIsDeleting(false);

    if (!response.success) {
      toast.error("Delete failed", {
        description: response.message,
      });
      return;
    }

    toast.success("Item deleted", {
      description: response.message,
    });

    if (onDeleted) {
      await onDeleted();
    }

    setDeleteDialogOpen(false);
    onOpenChange(false);
  };

  const fieldErrorText = (field: keyof FormState) => {
    const errors = fieldErrors[field];
    if (!errors || errors.length === 0) return null;
    return <p className="text-sm font-medium text-destructive">{errors.join(", ")}</p>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Item Details</DialogTitle>
        </DialogHeader>

        {!hasItem && (
          <p className="text-sm text-muted-foreground">Select an item to edit its details.</p>
        )}

        {formError && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {formError}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSave}>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={formState.name}
              onChange={handleInputChange("name")}
              required
              disabled={!hasItem || isSaving}
            />
            {fieldErrorText("name")}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={formState.brand}
                onChange={handleInputChange("brand")}
                disabled={!hasItem || isSaving}
              />
              {fieldErrorText("brand")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Input
                id="edit-type"
                value={formState.type}
                onChange={handleInputChange("type")}
                disabled={!hasItem || isSaving}
              />
              {fieldErrorText("type")}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                value={formState.color}
                onChange={handleInputChange("color")}
                disabled={!hasItem || isSaving}
              />
              {fieldErrorText("color")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-size">Size</Label>
              <Input
                id="edit-size"
                value={formState.size}
                onChange={handleInputChange("size")}
                disabled={!hasItem || isSaving}
              />
              {fieldErrorText("size")}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formState.description}
              onChange={handleInputChange("description")}
              disabled={!hasItem || isSaving}
            />
            {fieldErrorText("description")}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formState.price}
                onChange={handleInputChange("price")}
                disabled={!hasItem || isSaving}
              />
              {fieldErrorText("price")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date Purchased</Label>
              <Input
                id="edit-date"
                type="date"
                value={formState.datePurchased}
                onChange={handleInputChange("datePurchased")}
                disabled={!hasItem || isSaving}
              />
              {fieldErrorText("datePurchased")}
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="sm:mr-auto" disabled={!hasItem || isSaving}>
                  Delete Item
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The clothing item will be removed from your wardrobe.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="submit" disabled={!hasItem || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
