import type { Metadata } from "next";
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
      {children}
      <ThemePreviewSwitch />
    </>
  );

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "development" ? (
          <script
            id="metis-dev-theme-preview-init"
            dangerouslySetInnerHTML={{ __html: devThemePreviewInitScript() }}
          />
        ) : null}
      </head>
      <body>{clerkEnabled ? <ClerkProvider>{tree}</ClerkProvider> : tree}</body>
    </html>
  );
}
