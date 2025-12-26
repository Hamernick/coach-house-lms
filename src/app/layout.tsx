import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

import { Inter, JetBrains_Mono } from "next/font/google"
import Script from "next/script"

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
      <head>
        {process.env.NODE_ENV === "development" && (
          <>
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              crossOrigin="anonymous"
              strategy="beforeInteractive"
              data-enabled="true"
            />
            <Script
              src="//unpkg.com/@react-grab/opencode/dist/client.global.js"
              strategy="lazyOnload"
            />
          </>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
