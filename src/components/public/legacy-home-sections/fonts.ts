import { Inter, Sora } from "next/font/google"

export const legacyHomeHeadingFont = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading",
  preload: false,
})

export const legacyHomeInterFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
})

export const LEGACY_HOME_BODY_CLASSNAME = legacyHomeInterFont.className
