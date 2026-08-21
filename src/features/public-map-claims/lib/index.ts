import { z } from "zod"

export const publicMapClaimTargetKindSchema = z.enum([
  "platform_organization",
  "resource_map_organization",
  "new",
])

const trimmedString = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum)

export const publicMapClaimInputSchema = z
  .object({
    targetKind: publicMapClaimTargetKindSchema,
    targetId: z.string().uuid().nullable().optional(),
    listingName: trimmedString(2, 160),
    claimantName: trimmedString(2, 120),
    claimantEmail: z.string().trim().email().max(254),
    message: z.string().trim().max(2000).optional().default(""),
    submissionKey: z.string().uuid(),
    website: z.string().max(0).optional().default(""),
  })
  .superRefine((value, context) => {
    const needsTarget = value.targetKind !== "new"
    if (needsTarget !== Boolean(value.targetId)) {
      context.addIssue({
        code: "custom",
        message: "Choose a valid listing.",
        path: ["targetId"],
      })
    }
  })

export type PublicMapClaimInput = z.infer<typeof publicMapClaimInputSchema>

export function parsePublicMapClaimInput(value: unknown) {
  return publicMapClaimInputSchema.safeParse(value)
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}
