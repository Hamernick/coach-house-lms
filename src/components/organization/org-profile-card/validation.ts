import { z } from "zod"

import { isValidExternalUrl } from "@/lib/organization/urls"

export const hexColor = z
  .string()
  .regex(/^#?[0-9a-fA-F]{6}$/i, "Must be a hex color like #0055FF")
  .transform((value) => {
    if (!value) return value
    return value.startsWith("#") ? value : `#${value}`
  })
  .optional()
  .or(z.literal(""))

const urlInput = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || isValidExternalUrl(value), {
    message: "Enter a valid URL or domain",
  })
  .optional()

export const organizationProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  tagline: z.string().max(160).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
  ein: z
    .string()
    .regex(/^[0-9]{2}-?[0-9]{7}$/i, "EIN must be 9 digits (e.g., 12-3456789)")
    .optional()
    .or(z.literal("")),
  rep: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().max(60).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  addressStreet: z.string().max(400).optional().or(z.literal("")),
  addressCity: z.string().max(200).optional().or(z.literal("")),
  addressState: z.string().max(200).optional().or(z.literal("")),
  addressPostal: z.string().max(40).optional().or(z.literal("")),
  addressCountry: z.string().max(120).optional().or(z.literal("")),
  logoUrl: urlInput.or(z.literal("")),
  headerUrl: urlInput.or(z.literal("")),
  publicUrl: urlInput.or(z.literal("")),
  twitter: z.string().max(200).optional().or(z.literal("")),
  facebook: z.string().max(200).optional().or(z.literal("")),
  linkedin: z.string().max(200).optional().or(z.literal("")),
  instagram: z.string().max(200).optional().or(z.literal("")),
  youtube: z.string().max(200).optional().or(z.literal("")),
  tiktok: z.string().max(200).optional().or(z.literal("")),
  newsletter: z.string().max(200).optional().or(z.literal("")),
  github: z.string().max(200).optional().or(z.literal("")),
  vision: z.string().max(5000).optional().or(z.literal("")),
  mission: z.string().max(5000).optional().or(z.literal("")),
  need: z.string().max(5000).optional().or(z.literal("")),
  values: z.string().max(5000).optional().or(z.literal("")),
  programs: z.string().max(5000).optional().or(z.literal("")),
  reports: z.string().max(5000).optional().or(z.literal("")),
  boilerplate: z.string().max(5000).optional().or(z.literal("")),
  brandPrimary: hexColor,
  brandColors: z.array(hexColor).max(12).optional(),
  publicSlug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Use letters, numbers, and dashes only")
    .max(60)
    .optional()
    .or(z.literal("")),
  isPublic: z.boolean().optional(),
})
