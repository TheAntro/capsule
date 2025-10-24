"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";

export default function SignInDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const emailId = useId();
  const passwordId = useId();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    const res = await signIn.email({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (res.error) {
      setError(res.error.message || "Something went wrong.");
    } else {
      router.push("/dashboard");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign In</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>Enter your credentials to access your wardrobe.</DialogDescription>
        </DialogHeader>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input id={emailId} name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor={passwordId}>Password</Label>
            <Input id={passwordId} name="password" type="password" required />
          </div>
          <DialogFooter className="sm:justify-center">
            <Button type="submit" className="cursor-pointer">
              Sign In
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
