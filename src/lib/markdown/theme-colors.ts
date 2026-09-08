type Rgb = [number, number, number]
type ColorRole = "text" | "highlight"

const NAMED_COLORS: Record<string, string> = {
  black: "000000",
  white: "ffffff",
  gray: "808080",
  grey: "808080",
  silver: "c0c0c0",
  dimgray: "696969",
  darkgray: "a9a9a9",
  lightgray: "d3d3d3",
  red: "ff0000",
  maroon: "800000",
  orange: "ffa500",
  yellow: "ffff00",
  olive: "808000",
  lime: "00ff00",
  green: "008000",
  teal: "008080",
  aqua: "00ffff",
  cyan: "00ffff",
  blue: "0000ff",
  navy: "000080",
  purple: "800080",
  rebeccapurple: "663399",
  fuchsia: "ff00ff",
  magenta: "ff00ff",
  pink: "ffc0cb",
  brown: "a52a2a",
  gold: "ffd700",
}

export const THEME_COLOR_PATTERN = /^light-dark\(#[\da-f]{6},\s*#[\da-f]{6}\)$/i

function parseColor(value: string): Rgb | null {
  const input = value.trim().toLowerCase()
  const hex = NAMED_COLORS[input] ?? input.match(/^#([\da-f]{3,8})$/)?.[1]
  if (hex && [3, 4, 6, 8].includes(hex.length)) {
    const full =
      hex.length < 5 ? [...hex].map((part) => part + part).join("") : hex
    if (full.length === 8 && full.endsWith("00")) return null
    return [0, 2, 4].map((start) =>
      parseInt(full.slice(start, start + 2), 16)
    ) as Rgb
  }
  const rgb = input.match(/^rgba?\(([^)]+)\)$/)
  if (rgb) {
    const parts = rgb[1].split(/[\s,\/]+/).filter(Boolean)
    if (
      parts.length < 3 ||
      parts.length > 4 ||
      parts.some((part) => !/^\d*\.?\d+%?$/.test(part))
    )
      return null
    if (parts.length === 4 && parseFloat(parts[3]) === 0) return null
    return parts
      .slice(0, 3)
      .map((part) =>
        Math.min(255, parseFloat(part) * (part.endsWith("%") ? 2.55 : 1))
      ) as Rgb
  }
  const hsl = input.match(
    /^hsla?\((-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.%]+))?\)$/
  )
  if (!hsl) return null
  if (
    hsl.slice(1, 4).some((part) => !Number.isFinite(Number(part))) ||
    (hsl[4] && parseFloat(hsl[4]) === 0)
  )
    return null
  const hue = ((Number(hsl[1]) % 360) + 360) % 360
  const saturation = Math.min(1, Number(hsl[2]) / 100)
  const lightness = Math.min(1, Number(hsl[3]) / 100)
  const amplitude = saturation * Math.min(lightness, 1 - lightness)
  return [0, 8, 4].map((offset) => {
    const k = (offset + hue / 30) % 12
    return (
      255 * (lightness - amplitude * Math.max(-1, Math.min(k - 3, 9 - k, 1)))
    )
  }) as Rgb
}

function luminance(rgb: Rgb) {
  const linear = rgb.map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

function adjustColor(rgb: Rgb, target: number, lighten: boolean) {
  for (let step = 0; step <= 100; step++) {
    const adjusted = rgb.map((channel) =>
      Math.round(channel + (((lighten ? 255 : 0) - channel) * step) / 100)
    ) as Rgb
    if (lighten ? luminance(adjusted) >= target : luminance(adjusted) <= target)
      return adjusted
  }
  return lighten ? ([255, 255, 255] as Rgb) : ([0, 0, 0] as Rgb)
}

function hexColor(rgb: Rgb) {
  return `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`
}

/** Store both viewing colors, so switching themes never rewrites document content. */
export function themeTextColor(
  value: string,
  role: ColorRole = "text"
): string {
  const fallback = role === "text" ? "inherit" : "transparent"
  const input = value.trim()
  const pair = input.match(
    /^light-dark\((#[\da-f]{6}|rgb\([^()]+\)),\s*(#[\da-f]{6}|rgb\([^()]+\))\)$/i
  )
  if (pair) {
    const [light, dark] = pair.slice(1).map(parseColor)
    if (!light || !dark) return fallback
    const readable =
      role === "text"
        ? luminance(light) <= 0.1 && luminance(dark) >= 0.7
        : luminance(light) >= 0.8 && luminance(dark) <= 0.07
    if (readable) return `light-dark(${hexColor(light)}, ${hexColor(dark)})`
    return themeTextColor(hexColor(light), role)
  }
  const rgb = parseColor(input)
  // Neutral Word ink and page fills belong to the application's theme.
  if (!rgb || Math.max(...rgb) - Math.min(...rgb) <= 24) return fallback
  const light = adjustColor(
    rgb,
    role === "text" ? 0.1 : 0.8,
    role === "highlight"
  )
  const dark = adjustColor(rgb, role === "text" ? 0.7 : 0.07, role === "text")
  return `light-dark(${hexColor(light)}, ${hexColor(dark)})`
}

export function normalizeTextColorStyles(style: string) {
  return style.replace(
    /(^|;)\s*(color|background-color)\s*:\s*([^;]*)/gi,
    (_, separator: string, property: string, value: string) =>
      `${separator}${property}:${themeTextColor(value, property.toLowerCase() === "color" ? "text" : "highlight")}`
  )
}
