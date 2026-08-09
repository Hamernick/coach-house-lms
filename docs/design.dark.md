---
version: alpha
name: Geist Dark
description: Vercel's Geist design system, Dark theme. Pair this with docs/design.md for light-theme work.
colors:
  primary: "#ededed"
  secondary: "#a1a1a1"
  tertiary: "#52a8ff"
  neutral: "#1f1f1f"
  background-100: "#0a0a0a"
  background-200: "#111111"
  gray-100: "#1a1a1a"
  gray-200: "#1f1f1f"
  gray-300: "#292929"
  gray-400: "#333333"
  gray-500: "#4d4d4d"
  gray-600: "#666666"
  gray-700: "#888888"
  gray-800: "#a1a1a1"
  gray-900: "#c7c7c7"
  gray-1000: "#ededed"
  gray-alpha-100: "#ffffff0f"
  gray-alpha-200: "#ffffff17"
  gray-alpha-300: "#ffffff1f"
  gray-alpha-400: "#ffffff26"
  gray-alpha-500: "#ffffff40"
  gray-alpha-600: "#ffffff59"
  gray-alpha-700: "#ffffff73"
  gray-alpha-800: "#ffffff8f"
  gray-alpha-900: "#ffffffb3"
  gray-alpha-1000: "#ffffffe6"
  blue-100: "#001a33"
  blue-200: "#00264d"
  blue-300: "#003366"
  blue-400: "#004280"
  blue-500: "#0059b3"
  blue-600: "#0070f3"
  blue-700: "#3291ff"
  blue-800: "#52a8ff"
  blue-900: "#8cc8ff"
  blue-1000: "#d6ecff"
  red-100: "#2a0008"
  red-200: "#3d000d"
  red-300: "#5c0015"
  red-400: "#7a001c"
  red-500: "#a50026"
  red-600: "#d8001b"
  red-700: "#ff3b4f"
  red-800: "#ff6f7d"
  red-900: "#ffb3ba"
  red-1000: "#ffe5e7"
  amber-100: "#2a1200"
  amber-200: "#3d1b00"
  amber-300: "#5c2900"
  amber-400: "#7a3700"
  amber-500: "#a34a00"
  amber-600: "#c96800"
  amber-700: "#ffae00"
  amber-800: "#ffc043"
  amber-900: "#ffe19a"
  amber-1000: "#fff4cf"
  green-100: "#00210a"
  green-200: "#003315"
  green-300: "#004d22"
  green-400: "#006b30"
  green-500: "#008f42"
  green-600: "#13b457"
  green-700: "#45d878"
  green-800: "#75e69a"
  green-900: "#b5f5c8"
  green-1000: "#e5fce7"
  teal-100: "#00231f"
  teal-200: "#003832"
  teal-300: "#005047"
  teal-400: "#006e62"
  teal-500: "#008f80"
  teal-600: "#00ac96"
  teal-700: "#00d6bd"
  teal-800: "#52f0db"
  teal-900: "#a4f7ec"
  teal-1000: "#ddfef6"
  purple-100: "#210033"
  purple-200: "#31004d"
  purple-300: "#46006f"
  purple-400: "#5f0099"
  purple-500: "#7d00cc"
  purple-600: "#a000f8"
  purple-700: "#bd5cff"
  purple-800: "#d58cff"
  purple-900: "#e9c2ff"
  purple-1000: "#f9f0ff"
  pink-100: "#300016"
  pink-200: "#460523"
  pink-300: "#660b34"
  pink-400: "#8a1148"
  pink-500: "#b81761"
  pink-600: "#e4106e"
  pink-700: "#f22782"
  pink-800: "#f97ea7"
  pink-900: "#fdb3cc"
  pink-1000: "#ffe8f3"
typography:
  defaultFont: Geist Sans
  monoFont: Geist Mono
  body:
    color: "{colors.gray-1000}"
    mutedColor: "{colors.gray-800}"
components:
  surface:
    backgroundColor: "{colors.background-100}"
    borderColor: "{colors.gray-alpha-400}"
    textColor: "{colors.gray-1000}"
  surface-subtle:
    backgroundColor: "{colors.background-200}"
    borderColor: "{colors.gray-alpha-300}"
    textColor: "{colors.gray-900}"
  button-primary:
    backgroundColor: "{colors.gray-1000}"
    textColor: "{colors.background-100}"
    hoverBackgroundColor: "{colors.gray-900}"
  button-secondary:
    backgroundColor: "{colors.background-100}"
    textColor: "{colors.gray-1000}"
    borderColor: "{colors.gray-alpha-400}"
  focus-ring:
    boxShadow: "0 0 0 2px #0a0a0a, 0 0 0 4px #3291ff"
---

# Geist Dark

## Overview

Use this file for dark-mode implementations after reading `docs/design.md`.
The token names intentionally match the light theme so components can switch
themes without changing semantic intent.

Dark surfaces should stay quiet and high-contrast: use `background-100` for the
page and primary cards, `background-200` for subtle separation, and
`gray-alpha-*` for borders, dividers, overlays, and hover states. Avoid lifting
large areas with saturated color; reserve solid accents for state, links, focus,
and the single most important action.

## Token Intent

- `gray-1000` primary text and icons
- `gray-900` strong secondary text
- `gray-800` secondary text and muted icons
- `gray-700` disabled text and low-emphasis metadata
- `gray-alpha-300` default dividers
- `gray-alpha-400` default borders
- `gray-alpha-500` hover borders
- `blue-700` focus rings and links
- `red-700` destructive/error state
- `amber-700` warning state
- `green-700` success state

## Components

- Primary button: solid `gray-1000` fill with `background-100` text.
- Secondary button: `background-100` fill, `gray-1000` text, and
  `gray-alpha-400` border.
- Tertiary button: transparent fill with `gray-1000` text and a
  `gray-alpha-200` hover tint.
- Inputs: `background-100` fill, `gray-alpha-400` border, `gray-1000` text,
  and `gray-800` placeholder text.
- Cards and panels: use `background-100` for primary surfaces, then
  `background-200` only for nested or secondary surfaces.
- Focus: preserve the two-layer ring in the tokens above; never remove focus
  indication in dark mode.

## Rules

- Do not copy light-theme gray or background values into dark surfaces.
- Do not signal state with color alone; pair it with text or an icon.
- Do not use accent fills for ambient decoration.
- Keep WCAG AA contrast for body text and controls.
- Keep shadows subtle; prefer tonal contrast and borders for hierarchy.
