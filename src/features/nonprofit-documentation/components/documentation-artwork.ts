import blue from "../assets/abstract-blue.webp"
import rose from "../assets/abstract-rose.webp"
import warm from "../assets/abstract-warm.webp"

export const documentationArtwork = { blue, rose, warm } as const

export type DocumentationArtworkTone = keyof typeof documentationArtwork
