import { Sora } from "next/font/google"

export const legacyHomeHeadingFont = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading",
  preload: false,
})

export const legacyHomeInterFont = { className: "font-sans" } as const

export const LEGACY_HOME_BODY_CLASSNAME = legacyHomeInterFont.className
