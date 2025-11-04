"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page - dashboard is now integrated into the home page
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
      <p className="text-center text-muted-foreground">Redirecting...</p>
    </div>
  );
}
