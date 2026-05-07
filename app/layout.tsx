import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemePreviewSwitch } from "@/components/dev/ThemePreviewSwitch";
import { devThemePreviewInitScript } from "@/components/dev/dev-theme-preview";

export const metadata: Metadata = {
  title: "Metis",
  description: "Corporate comms issue-briefing workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        {process.env.NODE_ENV === "development" ? (
          <Script id="metis-dev-theme-preview-init" strategy="beforeInteractive">
            {devThemePreviewInitScript()}
          </Script>
        ) : null}
        {children}
        <ThemePreviewSwitch />
      </body>
    </html>
  );
}

