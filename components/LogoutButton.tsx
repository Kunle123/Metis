"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [submitting, setSubmitting] = useState(false);

  if (pathname === "/login") return null;

  async function onLogout() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      router.push("/login");
    }
  }

  return (
    <Button
      type="button"
      onClick={onLogout}
      disabled={submitting}
      variant="outline"
      className="rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper]"
    >
      {submitting ? "Logging out..." : "Log out"}
    </Button>
  );
}

