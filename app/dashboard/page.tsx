"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Import Dialog components
import AddItemForm from "@/components/AddItemForm";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSaveComplete = () => {
    setIsDialogOpen(false);
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
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome, {user.name || "User"}!</p>
      <p>Email: {user.email}</p>
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
      <button
        onClick={() => signOut()}
        className="w-full bg-white text-black font-medium rounded-md px-4 py-2 hover:bg-gray-200"
      >
        Sign Out
      </button>
    </main>
  );
}
