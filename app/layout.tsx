import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metis",
  description: "Corporate comms issue-briefing workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}

