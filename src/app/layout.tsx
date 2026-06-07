import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Helix Signal · Life-science & medtech intelligence",
  description:
    "Prioritized life-science and medtech market signals — VC deals, M&A, incubator cohorts, research and events — tuned to who you are and what you need today.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
