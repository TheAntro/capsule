"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { FormState } from "./joinWaitlist";

type WaitlistSubmitButtonProps = {
  formState: FormState;
};

export default function WaitlistSubmitButton({ formState }: WaitlistSubmitButtonProps) {
  const { pending } = useFormStatus();

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (formState.success) {
      setSuccess(true);
      timer = setTimeout(() => {
        setSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formState]);

  return (
    <div className="flex w-full items-center justify-center">
      <Button
        type="submit"
        variant="default"
        size="lg"
        className="group px-6 transform-gpu transition-transform duration-250 ease-in-out hover:scale-105 cursor-pointer disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2">
          <span>Join Waitlist</span>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin opacity-90" />
          ) : success ? (
            <Check className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4 transform-gpu transition-all duration-250 ease-in-out opacity-90 group-hover:translate-x-1 group-hover:opacity-100" />
          )}
        </span>
      </Button>
    </div>
  );
}
