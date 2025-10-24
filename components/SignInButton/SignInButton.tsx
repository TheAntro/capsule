"use client";

import { useSession } from "@/lib/auth-client";
import SignOutButton from "./SignOutButton";
import SignInDialog from "./SignInDialog";

export default function SignInButton() {
  const { data: session, isPending } = useSession();
  console.log("Session data:", session);

  if (isPending) {
    return null;
  }

  if (session?.user) {
    return <SignOutButton />;
  }
  return <SignInDialog />;
}
