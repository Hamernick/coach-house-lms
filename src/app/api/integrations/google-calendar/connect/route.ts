import { calendarHandler } from "@/features/google-calendar"
export const runtime = "nodejs"
export const maxDuration = 60
export const POST = calendarHandler("connect")
