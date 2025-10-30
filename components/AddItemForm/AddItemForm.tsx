"use client";

import { useState, useActionState, useEffect, startTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import { createClothingItem } from "@/actions/clothing"; // Import your action and initial state

// A simple component to display field errors
function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="text-sm font-medium text-destructive">{errors.join(", ")}</p>;
}

const initialState = {
  message: "",
  errors: {} as Record<string, string[] | undefined>,
};

export function AddItemForm({ onSaveComplete }: { onSaveComplete: () => void }) {
  // The useActionState hook manages form state and submission
  const [state, formAction] = useActionState(createClothingItem, initialState);

  // Local state for loading indicators
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Controlled component state for all form fields
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState("");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [datePurchased, setDatePurchased] = useState("");
  const [size, setSize] = useState("");
  const [imageUrlFront, setImageUrlFront] = useState("");
  const [imageUrlBack, setImageUrlBack] = useState("");

  const canAnalyze = imageUrlFront && imageUrlBack;

  // Effect to watch for "Success" message from the action
  useEffect(() => {
    setIsSaving(false); // Stop loading spinner on response
    if (state.message === "Success") {
      toast.success("Item Saved!", {
        description: "Added to your wardrobe.",
      });
      onSaveComplete(); // Close the modal/sheet
    } else if (state.message && state.message !== "Validation failed.") {
      // Show other errors (e.g., database failure)
      toast.error("Save Failed", {
        description: state.message,
      });
    }
  }, [state, onSaveComplete]);

  // 1. AI Auto-fill Logic
  const handleAiAnalysis = async () => {
    if (!canAnalyze) return;
    setIsAiLoading(true);
    try {
      const response = await fetch("/api/ai/analyze-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrlFront, imageUrlBack }),
      });
      if (!response.ok) throw new Error("AI analysis failed");

      const data = await response.json();

      // Populate controlled component state
      setBrand(data.brand || "Unknown");
      setType(data.type || "");
      setColor(data.color || "");
      setDescription(data.description || "");
      setName(`${data.color} ${data.type}` || "New Item");

      toast.success("AI Analysis Complete", {
        description: "Details have been auto-filled.",
      });
    } catch {
      toast.error("AI Failed", {
        description: "Could not analyze images.",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // 2. Submit Logic
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default browser submission
    setIsSaving(true); // Start loading spinner
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData); // Call the server action
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* --- Image Uploaders --- */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <ImageUploader label="Front Image" onUploadComplete={(url) => setImageUrlFront(url)} />
          {/* Hidden input to send URL to the action */}
          <input type="hidden" name="imageUrlFront" value={imageUrlFront} />
          <FieldError errors={state.errors?.imageUrlFront} />
        </div>
        <div className="space-y-1">
          <ImageUploader label="Back Image" onUploadComplete={(url) => setImageUrlBack(url)} />
          <input type="hidden" name="imageUrlBack" value={imageUrlBack} />
          <FieldError errors={state.errors?.imageUrlBack} />
        </div>
      </div>

      {/* --- AI Button --- */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!canAnalyze || isAiLoading}
        onClick={handleAiAnalysis}
      >
        {isAiLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-4 w-4" />
        )}
        Auto-fill with AI
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        AI-filled details (you can edit these):
      </p>

      {/* --- AI-Filled Fields --- */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Blue Denim Jacket"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FieldError errors={state.errors?.name} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            name="brand"
            placeholder="e.g., Levi's"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <FieldError errors={state.errors?.brand} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Input
            id="type"
            name="type"
            placeholder="e.g., Denim Jacket"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
          <FieldError errors={state.errors?.type} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          name="color"
          placeholder="e.g., Light Wash Blue"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <FieldError errors={state.errors?.color} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="A short description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <FieldError errors={state.errors?.description} />
      </div>

      <p className="text-sm text-center text-muted-foreground">Optional details:</p>

      {/* --- Optional Fields --- */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            placeholder="29.99"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <FieldError errors={state.errors?.price} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="datePurchased">Date Purchased</Label>
          <Input
            id="datePurchased"
            name="datePurchased"
            type="date"
            value={datePurchased}
            onChange={(e) => setDatePurchased(e.target.value)}
          />
          <FieldError errors={state.errors?.datePurchased} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="size">Size</Label>
          <Input
            id="size"
            name="size"
            placeholder="e.g., Medium"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
          <FieldError errors={state.errors?.size} />
        </div>
      </div>

      {/* --- Submit Button --- */}
      <Button type="submit" className="w-full" disabled={isSaving || isAiLoading}>
        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Item"}
      </Button>
      {state.message && state.message !== "Success" && state.message !== "Validation failed." && (
        <p className="text-sm font-medium text-destructive text-center">{state.message}</p>
      )}
    </form>
  );
}
