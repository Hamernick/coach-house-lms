import type { Metadata } from "next"
import type { ReactNode } from "react"
import "@fontsource-variable/inter/wght.css"
import "./globals.css"

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { JetBrains_Mono } from "next/font/google"

import { ReactGrabLoader } from "@/components/dev/react-grab-loader"
import { AppProviders } from "@/components/providers/app-providers"
import { getLocale } from "@/lib/locale.server"

const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
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
      { url: "/favicon.ico", sizes: "any" },
      {
        url: "/coach-house-logo-dark.png",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/coach-house-logo-light.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: "/favicon.ico",
    apple: "/coach-house-logo-dark.png",
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
      <body
        className={`${geistMono.variable} bg-background min-h-screen font-sans antialiased`}
      >
        <ReactGrabLoader />
        <AppProviders>{children}</AppProviders>
        <Analytics />
        <SpeedInsights sampleRate={0.5} />
      </body>
    </html>
  )
}
