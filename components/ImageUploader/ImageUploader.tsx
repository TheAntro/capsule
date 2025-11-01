"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  label: string;
}

// Helper function to detect if a file is HEIC format
function isHeicFile(file: File): boolean {
  const heicMimeTypes = ["image/heic", "image/heif"];
  const heicExtensions = ["heic", "heif"];

  const lowerName = file.name.toLowerCase();
  const extension = lowerName.split(".").pop();

  return (
    heicMimeTypes.includes(file.type) ||
    (extension !== undefined && heicExtensions.includes(extension))
  );
}

// Helper function to convert HEIC to JPEG using heic2any library
async function convertHeicToJpeg(file: File): Promise<File> {
  // Dynamically import heic2any only when needed (client-side only)
  const heic2any = (await import("heic2any")).default;

  // heic2any can return either a single Blob or an array of Blobs
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  // Handle both single blob and array of blobs
  const jpegBlob = Array.isArray(result) ? result[0] : result;

  if (!jpegBlob || !(jpegBlob instanceof Blob)) {
    throw new Error("Failed to convert HEIC image to JPEG");
  }

  // Create a new File object from the blob
  const jpegFile = new File([jpegBlob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });

  return jpegFile;
}

export function ImageUploader({ onUploadComplete, label }: ImageUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      let fileToUpload = file;
      let contentType = file.type;
      let fileExtension = file.name.split(".").pop();

      // Check if file is HEIC and convert to JPEG if needed (before showing preview)
      if (isHeicFile(file)) {
        try {
          fileToUpload = await convertHeicToJpeg(file);
          contentType = "image/jpeg";
          fileExtension = "jpg";
          // Use converted JPEG for preview since HEIC may not display in browser
          setPreviewUrl(URL.createObjectURL(fileToUpload));
        } catch (conversionError) {
          console.error("HEIC conversion failed:", conversionError);
          toast.error("Conversion Failed", {
            description: "Could not convert HEIC image. Please try a different format.",
          });
          setPreviewUrl(null);
          setIsLoading(false);
          return;
        }
      } else {
        // For non-HEIC files, show preview immediately
        setPreviewUrl(URL.createObjectURL(file));
      }

      // 1. Get presigned URL from our API
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: contentType,
          fileExtension: fileExtension,
        }),
      });

      if (!presignResponse.ok) throw new Error("Failed to get presigned URL");
      const { uploadUrl, publicUrl } = await presignResponse.json();

      // 2. Upload file directly to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: fileToUpload,
        headers: { "Content-Type": contentType },
      });

      if (!uploadResponse.ok) throw new Error("S3 upload failed");

      // 3. Notify parent component of success
      onUploadComplete(publicUrl);
      toast.success(`${label} uploaded!`);
    } catch (error) {
      console.error(error);
      toast.error("Upload Failed", {
        description: error instanceof Error ? error.message : "Please try again.",
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
          accept="image/*"
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
