"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import WaitlistSubmitButton from "./WaitlistSubmitButton";
import { joinWaitlist } from "./joinWaitlist";

export default function WaitlistForm() {
  return (
    <form
      action={joinWaitlist}
      className="w-full max-w-xl bg-gray-50/70 dark:bg-gray-800/70 p-8 rounded-lg shadow-sm space-y-6"
      aria-label="Join the waitlist"
    >
      <div>
        <Label htmlFor="email" className="sr-only">
          Email
        </Label>
        <Input id="email" name="email" type="email" placeholder="your@email.com" required />
      </div>
      <div className="flex justify-center">
        <WaitlistSubmitButton />
      </div>
    </form>
  );
}
