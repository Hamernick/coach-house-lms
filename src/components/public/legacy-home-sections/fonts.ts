import { Inter, Sora, Space_Grotesk } from "next/font/google"

export const legacyHomeHeadingFont = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading",
})

export const legacyHomeInterFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
})

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
})

export const LEGACY_HOME_BODY_CLASSNAME = body.className
