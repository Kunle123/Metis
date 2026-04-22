"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || `Login failed (${res.status})`);
        return;
      }
      router.push(from);
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm text-[--metis-paper]">Email</label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-[--metis-paper]">Password</label>
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          className="h-11"
        />
      </div>

      {error ? <div className="rounded-md border border-rose-400/20 bg-rose-900/20 px-3 py-2 text-sm text-rose-100">{error}</div> : null}

      <Button onClick={onSubmit} disabled={submitting} className="w-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </div>
  );
}
