import { z } from "zod"
import {
  LESSON_SUBTITLE_MAX_LENGTH,
  LESSON_TITLE_MAX_LENGTH,
  MODULE_SUBTITLE_MAX_LENGTH,
  MODULE_TITLE_MAX_LENGTH,
  clampText,
} from "@/lib/lessons/limits"
import type { LessonWizardPayload, ProviderSlug } from "./types"

const zProviderSlug = z.enum([
  "youtube",
  "google-drive",
  "dropbox",
  "loom",
  "vimeo",
  "notion",
  "figma",
  "generic",
])

const zFormFieldType = z.enum([
  "short_text",
  "long_text",
  "select",
  "multi_select",
  "slider",
  "subtitle",
  "custom_program",
])

const zFormField = z.object({
  label: z.string().default("").transform((s) => s.trim()),
  type: zFormFieldType,
  required: z.boolean().default(false),
  placeholder: z.string().nullish().transform((s) => (s ? s.trim() : undefined)),
  description: z.string().nullish().transform((s) => (s ? s.trim() : undefined)),
  options: z.array(z.string()).nullish().transform((arr) => (Array.isArray(arr) ? arr.map((x) => String(x).trim()).filter(Boolean) : undefined)),
  min: z.number().nullable().optional(),
  max: z.number().nullable().optional(),
  step: z.number().nullable().optional(),
  programTemplate: z.string().nullish().transform((s) => (typeof s === "string" ? s : undefined)),
}).transform((f) => {
  if (f.type === "subtitle") {
    return { ...f, required: false, placeholder: undefined }
  }
  if (f.type === "select" || f.type === "multi_select") {
    return { ...f, options: f.options && f.options.length > 0 ? f.options : undefined }
  }
  if (f.type === "slider") {
    return { ...f }
  }
  if (f.type === "custom_program") {
    return { ...f, placeholder: undefined, options: undefined, min: undefined, max: undefined, step: undefined, programTemplate: f.programTemplate ?? "" }
  }
  // short_text, long_text
  return { ...f, options: undefined, min: undefined, max: undefined, step: undefined, programTemplate: undefined }
})

const zResource = z
  .object({
    title: z.string().default("").transform((s) => s.trim()),
    url: z.string().nullish().transform((s) => (s ? s.trim() : null)),
    provider: zProviderSlug.nullish().default("generic"),
  })
  .passthrough() // allow extra fields like { type: "link" }

const zModule = z.object({
  moduleId: z.string().nullish().optional(),
  title: z
    .string()
    .default("")
    .transform((s) => clampText(s.trim(), MODULE_TITLE_MAX_LENGTH)),
  subtitle: z
    .string()
    .default("")
    .transform((s) => clampText(s.trim(), MODULE_SUBTITLE_MAX_LENGTH)),
  body: z.string().default(""),
  videoUrl: z.string().default("").transform((s) => s.trim()),
  resources: z.array(zResource).default([]),
  formFields: z.array(zFormField).default([]),
})

const zLink = z.object({
  title: z.string().default("").transform((s) => s.trim()),
  url: z.string().default("").transform((s) => s.trim()),
  provider: zProviderSlug.default("generic"),
})

export const WizardPayloadSchema = z.object({
  title: z.string().default("").transform((s) => clampText(s.trim(), LESSON_TITLE_MAX_LENGTH)),
  subtitle: z.string().default("").transform((s) => clampText(s.trim(), LESSON_SUBTITLE_MAX_LENGTH)),
  body: z.string().default(""),
  videoUrl: z.string().default("").transform((s) => s.trim()),
  links: z.array(zLink).default([]),
  modules: z.array(zModule).default([]),
})

export function normalizeIncomingPayload(input: unknown): LessonWizardPayload {
  return WizardPayloadSchema.parse(input) as LessonWizardPayload
}

export function validateFinalPayload(payload: LessonWizardPayload): LessonWizardPayload {
  return WizardPayloadSchema.parse(payload) as LessonWizardPayload
}

