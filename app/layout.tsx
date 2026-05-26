import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { MetisThemeProvider } from "@/components/theme/MetisThemeProvider";
import { isMetisClerkEnabled } from "@/lib/auth/clerkEnv";

export const metadata: Metadata = {
  title: "Metis",
  description: "Corporate comms issue-briefing workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkEnabled = isMetisClerkEnabled();

  const tree = <MetisThemeProvider>{children}</MetisThemeProvider>;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{clerkEnabled ? <ClerkProvider>{tree}</ClerkProvider> : tree}</body>
    </html>
  );
}
