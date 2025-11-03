"use client";

import { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import { getClothingItems } from "@/actions/clothing";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { ShirtIcon } from "lucide-react";
import EditClothingItemDialog from "./EditClothingItemDialog";
import { ClothingItemWithDetails } from "./types";

async function getPresignedUrl(imageUrl: string): Promise<string> {
  const response = await fetch("/api/upload/presign-get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    throw new Error("Failed to get presigned URL");
  }

  const data = await response.json();
  return data.presignedUrl;
}

export type ClothingItemListRef = {
  refresh: () => void;
};

const ClothingItemList = forwardRef<ClothingItemListRef>((props, ref) => {
  const [items, setItems] = useState<ClothingItemWithDetails[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItemWithDetails | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const clothingItems = await getClothingItems();
      setItems(clothingItems);

      // Generate presigned URLs for all images
      const urlMap: Record<string, string> = {};
      await Promise.all(
        clothingItems.map(async (item) => {
          try {
            const presignedUrl = await getPresignedUrl(item.imageUrlFront);
            urlMap[item.id] = presignedUrl;
          } catch (error) {
            console.error(`Failed to get presigned URL for item ${item.id}:`, error);
          }
        })
      );
      setImageUrls(urlMap);
    } catch (error) {
      console.error("Failed to fetch clothing items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchItems,
  }));

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCardClick = (item: ClothingItemWithDetails) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedItem(null);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading items...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ShirtIcon className="w-12 h-12 mb-4" />
        <p className="text-sm">No items yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 w-full">
        {items.map((item) => (
          <Card
            key={item.id}
            className="p-4 cursor-pointer transition hover:border-primary/60"
            onClick={() => handleCardClick(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleCardClick(item);
              }
            }}
          >
            <div className="flex gap-4">
              {/* Image on the left */}
              <div className="flex-shrink-0">
                {imageUrls[item.id] ? (
                  <Image
                    src={imageUrls[item.id]}
                    alt={item.name || "Clothing item"}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Loading...</span>
                  </div>
                )}
              </div>

              {/* Content on the right */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-white mb-1 truncate">
                  {item.name || "Unnamed Item"}
                </h3>
                {item.brand && (
                  <p className="text-sm text-gray-400 mb-1">{item.brand}</p>
                )}
                {item.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <EditClothingItemDialog
        open={dialogOpen}
        item={selectedItem}
        onOpenChange={handleDialogChange}
        onUpdated={fetchItems}
        onDeleted={fetchItems}
      />
    </>
  );
});

ClothingItemList.displayName = "ClothingItemList";

export default ClothingItemList;

