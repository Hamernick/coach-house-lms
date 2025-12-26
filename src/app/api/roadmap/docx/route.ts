import { NextResponse } from "next/server"
import { Document, HeadingLevel, Packer, Paragraph } from "docx"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveRoadmapSections } from "@/lib/roadmap"
import { sanitizeHtml } from "@/lib/markdown/sanitize"

export const runtime = "nodejs"

function decodeHtml(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
}

function htmlToParagraphs(html: string): string[] {
  const sanitized = sanitizeHtml(html)
  const withBreaks = sanitized
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/?p\b[^>]*>/gi, "\n\n")
    .replace(/<\/?h[1-6]\b[^>]*>/gi, "\n\n")
    .replace(/<li\b[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
  const decoded = decodeHtml(withBreaks)
  return decoded
    .replace(/\n{3,}/g, "\n\n")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean)
}

function makeFilename(orgName: string) {
  const slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
  return `${slug || "roadmap"}-roadmap.docx`
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", user.id)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const sections = resolveRoadmapSections(profile).filter((section) => section.content.trim().length > 0)

  if (sections.length === 0) {
    return NextResponse.json({ error: "No roadmap content to export yet." }, { status: 400 })
  }

  const orgName =
    typeof profile.name === "string" && profile.name.trim().length > 0
      ? profile.name.trim()
      : "Your organization"

  const children: Paragraph[] = [
    new Paragraph({
      text: `${orgName} Strategic Roadmap`,
      heading: HeadingLevel.HEADING_1,
    }),
  ]

  sections.forEach((section) => {
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_2,
      }),
    )

    if (section.subtitle) {
      children.push(new Paragraph({ text: section.subtitle }))
    }

    htmlToParagraphs(section.content).forEach((block) => {
      children.push(new Paragraph({ text: block }))
    })
  })

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const filename = makeFilename(orgName)

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
      "Cache-Control": "no-store",
    },
  })
}
