import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

import { ToastProvider } from "@/components/providers/toast-provider"
import { getLocale } from "@/lib/locale"

export const metadata: Metadata = {
  title: {
    default: "Coach House LMS",
    template: "%s · Coach House LMS",
  },
  description:
    "A course platform built with Next.js, Tailwind CSS, and shadcn/ui. Bootstrapped in step S00.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const locale = getLocale()
  const language = locale.split("-")[0] ?? "en"
  return (
    <html lang={language} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}
