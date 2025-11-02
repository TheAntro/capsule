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
} from "@/components/ui/dialog"; // Import Dialog components
import AddItemForm from "@/components/AddItemForm";
import ClothingItemList from "@/components/ClothingItemList";
import type { ClothingItemListRef } from "@/components/ClothingItemList/ClothingItemList";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const clothingListRef = useRef<ClothingItemListRef>(null);

  const handleSaveComplete = () => {
    setIsDialogOpen(false);
    // Trigger refresh of the clothing list after a small delay to ensure DB write completes
    setTimeout(() => {
      clothingListRef.current?.refresh();
    }, 300);
  };

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/");
    }
  }, [isPending, session, router]);

  if (isPending) return <p className="text-center mt-8 text-white">Loading...</p>;
  if (!session?.user) return <p className="text-center mt-8 text-white">Redirecting...</p>;

  const { user } = session;

  return (
    <main className="max-w-md h-full flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="w-full flex-1 overflow-y-auto flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Wardrobe</h2>
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
        <div className="border rounded-lg bg-muted/50 p-4">
          <ClothingItemList ref={clothingListRef} />
        </div>
      </div>
    </main>
  );
}
