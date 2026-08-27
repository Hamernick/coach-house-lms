import { preprovisionGoogleSignup } from "@/lib/google-auth-provisioning"

export async function POST(request: Request) {
  let input: unknown

  try {
    input = await request.json()
  } catch {
    return Response.json({ ok: false, code: "invalid" }, { status: 400 })
  }

  const result = await preprovisionGoogleSignup(input)
  const status = result.ok ? 200 : result.code === "invalid" ? 400 : 503

  return Response.json(result, { status })
}
