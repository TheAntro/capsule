"use client";

import { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import { toggleCapsule } from "@/actions/clothing";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShirtIcon, Plus, Minus } from "lucide-react";
import EditClothingItemDialog from "./EditClothingItemDialog";
import { ClothingItemWithDetails } from "./types";
import { toast } from "sonner";

export type ClothingItemListRef = {
  refresh: () => void;
};

type ClothingItemListProps = {
  items: ClothingItemWithDetails[];
  imageUrls: Record<string, string>;
  loading: boolean;
  filter?: "all" | "capsule" | "attic";
  onToggle?: (itemId: string, newInCapsuleValue: boolean) => void;
  onRefresh?: () => void;
};

const ClothingItemList = forwardRef<ClothingItemListRef, ClothingItemListProps>(
  ({ items, imageUrls, loading, filter = "all", onToggle, onRefresh }, ref) => {
    const [localItems, setLocalItems] = useState<ClothingItemWithDetails[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ClothingItemWithDetails | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Update local items when props change
    useEffect(() => {
      setLocalItems(items);
    }, [items]);

    const refreshFromParent = useCallback(() => {
      // Trigger refresh in parent component
      onRefresh?.();
    }, [onRefresh]);

    useImperativeHandle(ref, () => ({
      refresh: refreshFromParent,
    }));

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

    const handleToggleCapsule = async (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      setTogglingId(itemId);

      // Find the item to toggle
      const itemToToggle = localItems.find((item) => item.id === itemId);
      if (!itemToToggle) return;

      const newInCapsuleValue = !itemToToggle.inCapsule;

      // Optimistic update - update local state immediately
      setLocalItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, inCapsule: newInCapsuleValue } : item
        )
      );

      // Notify parent immediately for capsule count update
      onToggle?.(itemId, newInCapsuleValue);

      try {
        const result = await toggleCapsule(itemId);
        if (result.success) {
          toast.success(result.message);
        } else {
          // Revert on error
          setLocalItems((prev) =>
            prev.map((item) =>
              item.id === itemId ? { ...item, inCapsule: !newInCapsuleValue } : item
            )
          );
          onToggle?.(itemId, !newInCapsuleValue);
          toast.error(result.message);
        }
      } catch (error) {
        // Revert on error
        setLocalItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, inCapsule: !newInCapsuleValue } : item
          )
        );
        onToggle?.(itemId, !newInCapsuleValue);
        console.error("Failed to toggle capsule:", error);
        toast.error("Failed to update item");
      } finally {
        setTogglingId(null);
      }
    };

    if (loading) {
      return <div className="text-center text-gray-400">Loading items...</div>;
    }

    // Filter items based on the filter prop
    const filteredItems = localItems.filter((item) => {
      if (filter === "capsule") return item.inCapsule;
      if (filter === "attic") return !item.inCapsule;
      return true; // "all"
    });

    if (filteredItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ShirtIcon className="w-12 h-12 mb-4" />
          <p className="text-sm">
            {filter === "capsule"
              ? "No items in your capsule yet"
              : filter === "attic"
                ? "No items in your attic"
                : "No items yet"}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-3 w-full">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="pt-2 pb-3 px-4 cursor-pointer transition hover:border-primary/60"
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
              <div className="flex flex-col gap-3">
                {/* First row: Name and Capsule toggle */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-white truncate flex-1">
                    {item.name || "Unnamed Item"}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleToggleCapsule(e, item.id)}
                    disabled={togglingId === item.id}
                    className="h-8 w-8 p-0 flex-shrink-0 flex items-center justify-center"
                    title={item.inCapsule ? "Remove from capsule" : "Add to capsule"}
                  >
                    {item.inCapsule ? (
                      <Minus className="w-4 h-4 text-primary" />
                    ) : (
                      <Plus className="w-4 h-4 text-primary" />
                    )}
                  </Button>
                </div>

                {/* Second row: Image and details */}
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

                  {/* Brand and description on the right */}
                  <div className="flex-1 min-w-0">
                    {item.brand && <p className="text-sm text-gray-400 mb-1">{item.brand}</p>}
                    {item.description && (
                      <p className="text-sm text-gray-500 line-clamp-3">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <EditClothingItemDialog
          open={dialogOpen}
          item={selectedItem}
          onOpenChange={handleDialogChange}
          onUpdated={onRefresh}
          onDeleted={onRefresh}
        />
      </>
    );
  }
);

ClothingItemList.displayName = "ClothingItemList";

export default ClothingItemList;
