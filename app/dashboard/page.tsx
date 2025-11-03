"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddItemForm from "@/components/AddItemForm";
import ClothingItemList from "@/components/ClothingItemList";
import type { ClothingItemListRef } from "@/components/ClothingItemList/ClothingItemList";
import { getClothingItems } from "@/actions/clothing";

// Capsule wardrobe recommendation: Research shows 30-40 items is optimal
const CAPSULE_RECOMMENDATION = 37;

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [capsuleCount, setCapsuleCount] = useState(0);
  const clothingListRef = useRef<ClothingItemListRef>(null);

  const fetchCapsuleCount = async () => {
    try {
      const items = await getClothingItems();
      const count = items.filter((item) => item.inCapsule).length;
      setCapsuleCount(count);
    } catch (error) {
      console.error("Failed to fetch capsule count:", error);
    }
  };

  const handleSaveComplete = () => {
    setIsDialogOpen(false);
    // Trigger refresh of the clothing list after a small delay to ensure DB write completes
    setTimeout(() => {
      clothingListRef.current?.refresh();
      fetchCapsuleCount();
    }, 300);
  };

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/");
    } else if (session?.user) {
      fetchCapsuleCount();
    }
  }, [isPending, session, router]);

  if (isPending) return <p className="text-center mt-8 text-white">Loading...</p>;
  if (!session?.user) return <p className="text-center mt-8 text-white">Redirecting...</p>;

  return (
    <main className="max-w-md h-full flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <div className="w-full flex-1 overflow-y-auto flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Wardrobe</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>+ Add New Item</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-[600px] overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add a New Clothing Item</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <AddItemForm onSaveComplete={handleSaveComplete} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="wardrobe" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="wardrobe">Wardrobe</TabsTrigger>
            <TabsTrigger value="capsule" className="px-3">
              Capsule
              <span className="ml-1.5 text-xs font-semibold">
                {capsuleCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="attic">Attic</TabsTrigger>
          </TabsList>

          <TabsContent value="wardrobe" className="mt-3">
            <div className="border rounded-lg bg-muted/50 p-4">
              <ClothingItemList ref={clothingListRef} filter="all" onToggle={fetchCapsuleCount} />
            </div>
          </TabsContent>

          <TabsContent value="capsule" className="mt-3">
            <div className="mb-3 text-sm text-muted-foreground">
              A capsule wardrobe typically contains {CAPSULE_RECOMMENDATION} versatile pieces that
              work together. You currently have{" "}
              <span className="font-semibold text-foreground">{capsuleCount}</span>{" "}
              {capsuleCount === 1 ? "item" : "items"} in your capsule.
            </div>
            <div className="border rounded-lg bg-muted/50 p-4">
              <ClothingItemList filter="capsule" onToggle={fetchCapsuleCount} />
            </div>
          </TabsContent>

          <TabsContent value="attic" className="mt-3">
            <div className="mb-3 text-sm text-muted-foreground">
              Items not currently in your capsule wardrobe.
            </div>
            <div className="border rounded-lg bg-muted/50 p-4">
              <ClothingItemList filter="attic" onToggle={fetchCapsuleCount} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
