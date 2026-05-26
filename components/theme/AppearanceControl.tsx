"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { SegmentedControl } from "@/components/ui/segmented-control";

type AppearanceValue = "light" | "dark" | "system";

const OPTIONS: Array<{ id: AppearanceValue; label: string }> = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

export function AppearanceControl({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <SegmentedControl<AppearanceValue>
      label="Appearance"
      value={(theme as AppearanceValue) ?? "dark"}
      options={OPTIONS}
      onChange={setTheme}
      className={className}
    />
  );
}
