import { NextResponse } from "next/server"

import {
  authorizeOrganizationGeocodingCronRequest,
  runOrganizationGeocodeSweep,
} from "@/features/organization-geocoding"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const authorization = authorizeOrganizationGeocodingCronRequest(request)
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status })
  }

  try {
    const result = await runOrganizationGeocodeSweep()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run organization geocoding cron."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
