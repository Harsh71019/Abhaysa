import type { Metadata, Viewport } from "next";
import type { ReactElement, ReactNode } from "react";
import { archivo, literata, jetbrainsMono } from "./fonts";
import { ThemeScript } from "./theme-script";
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
    { media: "(prefers-color-scheme: light)", color: "#F6E9B8" },
    { media: "(prefers-color-scheme: dark)", color: "#14171A" },
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
        {children}
      </body>
    </html>
  );
}
