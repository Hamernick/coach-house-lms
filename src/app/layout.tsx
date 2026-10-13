import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

import { Inter, JetBrains_Mono } from "next/font/google"

import { ReactGrabLoader } from "@/components/dev/react-grab-loader"
import { AppProviders } from "@/components/providers/app-providers"
import { getLocale } from "@/lib/locale.server"

const geistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Coach House",
    template: "%s · Coach House",
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
      <head />
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}>
        <ReactGrabLoader />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
