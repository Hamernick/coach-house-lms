"use client"

import { z } from "zod"
import { publicSharingEnabled } from "@/lib/feature-flags"

export const ProgramWizardSchema = z.object({
  title: z.string().min(1).max(160),
  subtitle: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  location: z.string().max(160).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  addressStreet: z.string().max(200).optional().or(z.literal("")),
  addressCity: z.string().max(120).optional().or(z.literal("")),
  addressState: z.string().max(120).optional().or(z.literal("")),
  addressPostal: z.string().max(40).optional().or(z.literal("")),
  addressCountry: z.string().max(120).optional().or(z.literal("")),
  statusLabel: z.string().max(60).optional().or(z.literal("")),
  ctaLabel: z.string().max(40).optional().or(z.literal("")),
  ctaUrl: z.string().url().optional().or(z.literal("")),
  goalUsd: z.coerce.number().nonnegative().optional(),
  raisedUsd: z.coerce.number().nonnegative().optional(),
  features: z.array(z.string().min(1)).optional().default([]),
  isPublic: z.boolean().optional(),
})

export type ProgramWizardFormState = z.infer<typeof ProgramWizardSchema>

export const defaultProgramWizardForm: ProgramWizardFormState = {
  title: "",
  subtitle: "",
  description: "",
  location: "",
  imageUrl: "",
  startDate: "",
  endDate: "",
  addressStreet: "",
  addressCity: "",
  addressState: "",
  addressPostal: "",
  addressCountry: "",
  statusLabel: "In progress",
  ctaLabel: "Learn more",
  ctaUrl: "",
  goalUsd: 0,
  raisedUsd: 0,
  features: ["12 Weeks", "Paid Stipend", "Applications Open"],
  isPublic: publicSharingEnabled,
}
