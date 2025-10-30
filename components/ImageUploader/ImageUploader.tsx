"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  label: string;
}

export function ImageUploader({ onUploadComplete, label }: ImageUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setPreviewUrl(URL.createObjectURL(file)); // Show instant local preview

    try {
      const fileExtension = file.name.split(".").pop();

      // 1. Get presigned URL from our API
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: file.type,
          fileExtension: fileExtension,
        }),
      });

      if (!presignResponse.ok) throw new Error("Failed to get presigned URL");
      const { uploadUrl, publicUrl } = await presignResponse.json();

      // 2. Upload file directly to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) throw new Error("S3 upload failed");

      // 3. Notify parent component of success
      onUploadComplete(publicUrl);
      toast.success(`${label} uploaded!`);
    } catch (error) {
      console.error(error);
      toast.error("Upload Failed", {
        description: "Please try again.",
      });
      setPreviewUrl(null); // Clear preview on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative aspect-square w-full rounded-md border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center p-4">
      <label
        htmlFor={`file-upload-${label}`}
        className="absolute inset-0 cursor-pointer rounded-md z-10"
      >
        <input
          id={`file-upload-${label}`}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : previewUrl ? (
        <Image
          src={previewUrl}
          alt="Upload preview"
          fill
          className="object-cover rounded-md"
          unoptimized
        />
      ) : (
        <div className="text-center">
          <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground" />
          <span className="mt-2 block text-sm font-medium text-muted-foreground">{label}</span>
        </div>
      )}
    </div>
  );
}
