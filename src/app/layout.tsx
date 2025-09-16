import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
