export const publicSharingEnabled = process.env.NEXT_PUBLIC_PUBLIC_SHARING_ENABLED === "true"

function parseDefaultOnFlag(value: string | undefined) {
  const normalized = value?.trim().toLowerCase()
  return normalized !== "0" && normalized !== "false" && normalized !== "off"
}

export const platformLabEnabled = parseDefaultOnFlag(process.env.NEXT_PUBLIC_ENABLE_PLATFORM_LAB)
