import type { FormationStatus, IntentFocus, RoleInterest } from "./types"

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
  return base.slice(0, 60).replace(/^-+|-+$/g, "")
}

export function resolveOnboardingError(raw: string | null) {
  switch (raw) {
    case "missing_org_name":
      return "Enter an organization name to continue."
    case "missing_org_slug":
      return "Enter an organization URL to continue."
    case "invalid_org_slug":
      return "That organization URL is invalid. Use letters, numbers, and hyphens."
    case "reserved_org_slug":
      return "That URL is reserved. Try something else."
    case "slug_taken":
      return "That URL is already taken. Try another."
    case "missing_intent_focus":
      return "Select your focus to continue."
    case "builder_plan_required":
      return "Choose a builder plan before continuing with workspace setup."
    case "intent_focus_coming_soon":
      return "That onboarding focus is coming soon. Select Build nonprofits to continue."
    default:
      return null
  }
}

export async function getCroppedBlob(
  imageSrc: string,
  area: { x: number; y: number; width: number; height: number },
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const size = Math.min(area.width, area.height)
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")
      if (!ctx) return resolve(null)
      ctx.fillStyle = "#fff"
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(
        img,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        size,
        size,
      )
      canvas.toBlob((blob) => resolve(blob), "image/png", 0.92)
    }
    img.onerror = () => resolve(null)
    img.src = imageSrc
  })
}

export function isFormationStatus(value: unknown): value is FormationStatus {
  return value === "pre_501c3" || value === "in_progress" || value === "approved"
}

export function isIntentFocus(value: unknown): value is IntentFocus {
  return value === "build" || value === "find" || value === "fund" || value === "support"
}

export function isRoleInterest(value: unknown): value is RoleInterest {
  return (
    value === "staff" ||
    value === "operator" ||
    value === "volunteer" ||
    value === "board_member"
  )
}
