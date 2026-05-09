import type { Metadata } from "next";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemePreviewSwitch } from "@/components/dev/ThemePreviewSwitch";
import { devThemePreviewInitScript } from "@/components/dev/dev-theme-preview";
import { isMetisClerkEnabled } from "@/lib/auth/clerkEnv";

export const metadata: Metadata = {
  title: "Metis",
  description: "Corporate comms issue-briefing workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkEnabled = isMetisClerkEnabled();

  const tree = (
    <>
      {process.env.NODE_ENV === "development" ? (
        <Script id="metis-dev-theme-preview-init" strategy="beforeInteractive">
          {devThemePreviewInitScript()}
        </Script>
      ) : null}
      {children}
      <ThemePreviewSwitch />
    </>
  );

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{clerkEnabled ? <ClerkProvider>{tree}</ClerkProvider> : tree}</body>
    </html>
  );
}
