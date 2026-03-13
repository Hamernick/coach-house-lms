import { z } from "zod"

export const signUpSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

export type SignUpValues = z.infer<typeof signUpSchema>

function isCaptchaFlagEnabled(enabled: boolean | string | null | undefined) {
  if (typeof enabled === "boolean") return enabled
  if (typeof enabled !== "string") return false
  return enabled.trim().toLowerCase() === "true"
}

export function isCaptchaConfigured(
  siteKey: string | null | undefined,
  enabled: boolean | string | null | undefined = false,
) {
  return isCaptchaFlagEnabled(enabled) && Boolean(siteKey && siteKey.trim().length > 0)
}
