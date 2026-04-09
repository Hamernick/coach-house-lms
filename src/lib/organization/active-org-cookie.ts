import { cookies } from "next/headers"

export const ACTIVE_ORGANIZATION_COOKIE = "coach_house_active_org"

const ACTIVE_ORGANIZATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function readActiveOrganizationCookie() {
  const cookieStore = await cookies()
  const value = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value?.trim()
  return value && value.length > 0 ? value : null
}

export async function writeActiveOrganizationCookie(orgId: string) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: ACTIVE_ORGANIZATION_COOKIE,
    value: orgId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACTIVE_ORGANIZATION_COOKIE_MAX_AGE,
  })
}

export async function clearActiveOrganizationCookie() {
  const cookieStore = await cookies()
  cookieStore.set({
    name: ACTIVE_ORGANIZATION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}
