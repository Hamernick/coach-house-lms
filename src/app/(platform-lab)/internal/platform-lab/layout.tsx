import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { notFound } from "next/navigation"

import "./platform-lab-theme.css"

import { platformLabEnabled } from "@/lib/feature-flags"
import { requireAdmin } from "@/lib/admin/auth"

const platformLabSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
  preload: false,
})

const platformLabMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: "Platform Lab",
  description: "Imported donor project dashboard for internal platform admins.",
}

export default async function PlatformLabLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  await requireAdmin()

  if (!platformLabEnabled) {
    notFound()
  }

  return (
    <div className={`${platformLabSans.variable} ${platformLabMono.variable} platform-lab-theme min-h-screen`}>
      {children}
    </div>
  )
}
