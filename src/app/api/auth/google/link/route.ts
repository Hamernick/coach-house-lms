import { validateGoogleAccountLink } from "@/features/google-auth"

export async function POST(request: Request) {
  let input: unknown

  try {
    input = await request.json()
  } catch {
    return Response.json({ ok: false, code: "invalid" }, { status: 400 })
  }

  const result = await validateGoogleAccountLink(input)
  const status = result.ok
    ? 200
    : result.code === "invalid"
      ? 400
      : result.code === "unauthorized"
        ? 401
        : result.code === "email_mismatch"
          ? 409
          : 503

  return Response.json(result, { status })
}
