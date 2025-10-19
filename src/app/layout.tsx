import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

import { ToastProvider } from "@/components/providers/toast-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { getLocale } from "@/lib/locale.server"

export const metadata: Metadata = {
  title: {
    default: "Coach House LMS",
    template: "%s · Coach House LMS",
  },
  description:
    "A course platform built with Next.js, Tailwind CSS, and shadcn/ui. Bootstrapped in step S00.",
  icons: {
    icon: [
      { url: "/favicon-light.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: "/favicon-light.svg",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const locale = await getLocale()
  const language = locale.split("-")[0] ?? "en"
  return (
    <html lang={language} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <ToastProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
