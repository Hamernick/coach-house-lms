import { loadEnvFiles } from "./utils/load-env.mjs"
import { createClient } from "@supabase/supabase-js"

loadEnvFiles()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

async function main() {
  const classSlug = "branding-messaging-and-audience-strategy"

  const { data: classRow, error: classErr } = await supabase
    .from("classes")
    .select("id, title")
    .eq("slug", classSlug)
    .maybeSingle()

  if (classErr || !classRow) {
    throw new Error(`Unable to find class with slug ${classSlug}: ${classErr?.message ?? "not found"}`)
  }

  const classDescription = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi mauris arcu, ultrices ac mauris et, congue bibendum metus. Donec vehicula, nibh ut porta sollicitudin, dui odio blandit massa, non semper justo sem vitae lorem.\n\n- Positioning sprints\n- Messaging pillars\n- Audience journey mapping\n\nDeliver a comprehensive blueprint that your team can use to align marketing, programs, and fundraising.`

  await supabase
    .from("classes")
    .update({ description: classDescription })
    .eq("id", classRow.id)

  const { data: moduleRow, error: moduleErr } = await supabase
    .from("modules")
    .select("id, title")
    .eq("class_id", classRow.id)
    .eq("idx", 1)
    .maybeSingle()

  if (moduleErr || !moduleRow) {
    throw new Error(`Unable to find module 1 for class ${classSlug}: ${moduleErr?.message ?? "not found"}`)
  }

  await supabase
    .from("modules")
    .update({
      title: "Brand Foundations Intensive",
      description: "Design the strategic backbone of your nonprofit brand in three focused sprints.",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      duration_minutes: 145,
      content_md: `## Session Outline\n\n1. Immersion and audit checklist\n2. Messaging architecture lab\n3. Visual identity alignment\n\n> Pro tip: keep every artifact in a living brand hub so your team never hunts through drives again.`,
    })
    .eq("id", moduleRow.id)

  const interactions = [
    {
      type: "poll",
      config: {
        question: "How confident is your team in describing the organization in one sentence?",
        scale_min: 1,
        scale_max: 5,
      },
    },
    {
      type: "prompt",
      config: {
        label: "Draft your refreshed brand promise",
        helper_text: "Keep it under 25 words and focus on the change you enable.",
      },
    },
    {
      type: "quiz",
      config: {
        question: "Which of the following is *not* a recommended messaging pillar?",
        options: [
          { label: "Impact narrative" },
          { label: "Audience need" },
          { label: "Program features" },
          { label: "Internal jargon" },
        ],
      },
    },
    {
      type: "activity",
      config: {
        label: "Select the archetypes that best align with your brand voice",
        options: [
          { label: "Explorer", value: "explorer" },
          { label: "Caregiver", value: "caregiver" },
          { label: "Sage", value: "sage" },
          { label: "Rebel", value: "rebel" },
        ],
      },
    },
  ]

  const resources = [
    {
      label: "Brand Voice Workbook",
      url: "https://example.org/resources/brand-voice-workbook.pdf",
      description: "Exercises to align tone and vocabulary across teams.",
    },
    {
      label: "Messaging Hierarchy Template",
      url: "https://example.org/resources/messaging-hierarchy-template.docx",
      description: "Document structure for pillars, proof points, and calls to action.",
    },
    {
      label: "Campaign Creative Gallery",
      url: "https://example.org/resources/creative-gallery",
      description: "Inspiration board with high-performing creative from peer orgs.",
    },
  ]

  const homework = [
    {
      label: "Mission statement punch-up",
      instructions: "Rewrite your current mission statement using the cadence from Sprint 1. Upload both the before and after versions.",
      upload_required: true,
    },
    {
      label: "Audience persona card",
      instructions: "Complete the persona canvas for your primary community segment. Focus on motivations, barriers, and proof they need to see.",
      upload_required: false,
    },
    {
      label: "Messaging QA checklist",
      instructions: "Answer the short questionnaire so we can calibrate your next coaching session.",
      upload_required: false,
    },
  ]

  const transcript = `### Full Session Transcript\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque finibus tincidunt lorem, sed varius arcu fermentum quis. Vestibulum eu augue feugiat, malesuada augue ullamcorper, faucibus magna.\n\n- Sprint 1 — Discovery audit\n- Sprint 2 — Messaging architecture\n- Sprint 3 — Activation roadmap\n\nSed at turpis porta, fermentum massa non, congue sapien. Vivamus finibus orci ac libero pharetra, non egestas neque interdum. Vivamus porta lorem et tristique ullamcorper.`

  const adminNotes = `Pre-work: confirm the team uploaded their communications calendar.\nPost-session: schedule 1:1 debrief to review brand promise drafts.`

  await supabase
    .from("module_content")
    .upsert(
      {
        module_id: moduleRow.id,
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        transcript,
        interactions,
        resources,
        homework,
        admin_notes: adminNotes,
      },
      { onConflict: "module_id" }
    )

  const assignmentSchema = {
    title: "Brand Messaging Blueprint",
    fields: [
      { name: "name", label: "Organization name", type: "text", org_key: "name" },
      { name: "audience_primary", label: "Primary audience description", type: "textarea" },
      {
        name: "tone_select",
        label: "Preferred tone",
        type: "select",
        options: [
          { label: "Warm & inspiring", value: "warm" },
          { label: "Bold & activist", value: "bold" },
          { label: "Expert & advisory", value: "expert" },
          { label: "Playful & approachable", value: "playful" },
        ],
      },
      { name: "proof_point", label: "Signature proof point", type: "textarea" },
      { name: "cta", label: "Primary call to action", type: "text" },
      {
        name: "boilerplate",
        label: "One-paragraph boilerplate",
        type: "textarea",
        org_key: "boilerplate",
      },
    ],
  }

  await supabase
    .from("module_assignments")
    .upsert(
      {
        module_id: moduleRow.id,
        schema: assignmentSchema,
        complete_on_submit: true,
      },
      { onConflict: "module_id" }
    )

  console.log("Branding module seeded successfully")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
