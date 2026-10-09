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

export function isCaptchaConfigured(siteKey: string | null | undefined) {
  return Boolean(siteKey && siteKey.trim().length > 0)
}
