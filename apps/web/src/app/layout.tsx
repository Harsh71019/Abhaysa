import type { Metadata, Viewport } from "next";
import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import { archivo, literata, jetbrainsMono } from "./fonts";
import { ThemeScript } from "./theme-script";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOCAL",
  description: "Turn the commute into interview prep.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LOCAL",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#060608" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${literata.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body
        className="min-h-dvh bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] font-reading text-foreground antialiased"
        suppressHydrationWarning
      >
        <ThemeToggle />
        <Link
          href="/library"
          className="fixed top-6 left-6 z-50 flex h-10 w-10 items-center justify-center rounded-xl glass-card text-foreground/80 hover:text-foreground hover:scale-105 active:scale-95 transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
          aria-label="Open Library"
          title="Library"
        >
          <svg className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </Link>
        {children}
      </body>
    </html>
  );
}
