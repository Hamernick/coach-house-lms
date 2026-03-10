import { NextResponse } from "next/server"

import {
  authorizeBoardReminderCronRequest,
  runBoardMeetingReminderSweep,
} from "../../../../../features/board-notifications/server/actions"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const authorization = authorizeBoardReminderCronRequest(request)
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status })
  }

  try {
    const result = await runBoardMeetingReminderSweep()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run board reminder cron."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
