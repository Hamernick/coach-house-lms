export type PublicMapTheme = "light" | "dark"

export const PUBLIC_MAP_DARK_INPUT_BORDER = "rgba(255, 255, 255, 0.15)"

export function normalizePublicMapTheme(theme: string | null | undefined) {
  return theme === "dark" ? "dark" : "light"
}
