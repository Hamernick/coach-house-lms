#!/usr/bin/env node
/**
 * Import curriculum (classes + modules) from a CSV file.
 *
 * Usage:
 *   node scripts/import-curriculum.mjs path/to/curriculum.csv [--wipe-all] [--purge-unlisted] [--commit]
 *
 * CSV headers (flexible; examples):
 *   class,class_slug,class_description,module_index,module_title,module_slug,module_description,published,duration
 *   or
 *   Class,Class Description,Index,Title,Description
 *
 * Behavior:
 *   - Maps rows to classes and ordered modules (idx).
 *   - Upserts classes by slug and modules by (class_id, slug).
 *   - If --purge-unlisted: deletes modules in each affected class that are not present in the CSV.
 *   - If --wipe-all: deletes ALL classes and modules before import.
 *   - Dry-run by default; requires --commit to write.
 *
 * Environment:
 *   Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env (e.g., `source .env.local`).
 */

import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function parseBool(v, fallback = true) {
  if (v == null) return fallback
  const s = String(v).trim().toLowerCase()
  if (["true", "1", "yes", "y"].includes(s)) return true
  if (["false", "0", "no", "n"].includes(s)) return false
  return fallback
}

function parseIntSafe(v, fallback = null) {
  const n = Number.parseInt(String(v ?? ""), 10)
  return Number.isFinite(n) ? n : fallback
}

function parseCSV(raw) {
  // Simple CSV parser that handles quotes and commas
  const lines = raw.replace(/\r\n?/g, "\n").split("\n").filter(Boolean)
  if (lines.length === 0) return []
  const headers = splitCSVLine(lines[0]).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cols = splitCSVLine(line)
    const row = {}
    headers.forEach((h, i) => (row[h] = cols[i]))
    return row
  })
}

function splitCSVLine(line) {
  const out = []
  let cur = ""
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQ = false
      } else {
        cur += ch
      }
    } else {
      if (ch === ',') {
        out.push(cur)
        cur = ""
      } else if (ch === '"') {
        inQ = true
      } else {
        cur += ch
      }
    }
  }
  out.push(cur)
  return out
}

function normalizeRow(row) {
  const normKeys = Object.fromEntries(
    Object.keys(row).map((k) => [k.toLowerCase().replace(/\s+/g, "_"), k])
  )

  const get = (...candidates) => {
    for (const c of candidates) {
      const key = normKeys[c]
      if (key && row[key] != null && String(row[key]).trim().length > 0) return row[key]
    }
    return null
  }

  // Class title: prefer explicit title/name columns over a numeric session number
  const classTitleRaw =
    get(
      "class_title",
      "class",
      "session_title",
      "session_name",
      "session_label",
      "lesson_title"
    ) ?? get("session") // last resort

  const classTitle = (() => {
    const v = String(classTitleRaw ?? "").trim()
    // If it's purely numeric (e.g., "1"), treat as missing
    if (/^\d+$/.test(v)) return ""
    return v
  })()

  const classSlug = (get("class_slug", "session_slug") ?? slugify(classTitle)) || slugify(classTitle)
  const classDescription =
    get("class_description", "session_description", "class_desc", "session_desc") ?? ""

  // Module index: accept many variants commonly seen in spreadsheets
  const moduleIndex = parseIntSafe(
    get(
      "module_index",
      "index",
      "position",
      "module_position",
      "module_number",
      "number",
      "order",
      "seq",
      "sequence"
    )
  )

  // Module title
  const moduleTitle =
    (get("module_title", "title", "lesson_title", "module_name", "name") ?? "").trim()

  const moduleSlug = (
    get("module_slug", "slug", "lesson_slug") ?? slugify(moduleTitle)
  ) || slugify(moduleTitle)

  const moduleDescription =
    get("module_description", "description", "module_desc", "lesson_description") ?? ""

  const moduleDuration = parseIntSafe(
    get("duration_minutes", "duration", "minutes", "mins", "length")
  )
  const isPublished = parseBool(get("published", "is_published", "module_published", "publish"), true)

  if (!classTitle || !moduleTitle || moduleIndex == null) {
    const available = Object.keys(row).join(", ")
    throw new Error(
      `Row missing required fields: classTitle='${classTitle}', moduleTitle='${moduleTitle}', moduleIndex='${moduleIndex}'. Available headers: [${available}]`
    )
  }

  return {
    class: { title: classTitle, slug: classSlug, description: classDescription, is_published: true },
    module: {
      idx: moduleIndex,
      slug: moduleSlug,
      title: moduleTitle,
      description: moduleDescription,
      duration_minutes: moduleDuration,
      is_published: isPublished,
    },
  }
}

async function main() {
  const [,, fileArg, ...flags] = process.argv
  if (!fileArg) {
    console.error("Usage: node scripts/import-curriculum.mjs <csv-path> [--wipe-all] [--purge-unlisted] [--commit]")
    process.exit(1)
  }

  const wipeAll = flags.includes("--wipe-all")
  const purgeUnlisted = flags.includes("--purge-unlisted")
  const commit = flags.includes("--commit")

  const filePath = path.resolve(fileArg)
  const csv = fs.readFileSync(filePath, "utf8")
  const rows = parseCSV(csv).filter((r) => Object.values(r).some((v) => String(v || "").trim().length > 0))

  const mapped = rows.map(normalizeRow)
  const byClass = new Map()
  for (const { class: klass, module } of mapped) {
    const key = klass.slug
    if (!byClass.has(key)) byClass.set(key, { klass, modules: [] })
    byClass.get(key).modules.push(module)
  }
  // sort modules by idx within each class
  for (const entry of byClass.values()) {
    entry.modules.sort((a, b) => a.idx - b.idx)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) {
    console.error("Missing env. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set (e.g., source .env.local)")
    process.exit(1)
  }

  const supabase = createClient(url, service, { auth: { persistSession: false } })

  console.log(`Parsed ${rows.length} rows → ${byClass.size} classes`)
  if (!commit) {
    console.log("Dry-run (no writes). Pass --commit to apply changes.")
  }

  if (wipeAll) {
    console.log("--wipe-all: will delete ALL modules and classes before import")
    if (commit) {
      const { error: mErr } = await supabase.from("modules").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      if (mErr) throw mErr
      const { error: cErr } = await supabase.from("classes").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      if (cErr) throw cErr
    }
  }

  // Fetch existing classes by slug
  const slugs = Array.from(byClass.keys())
  const { data: existingClasses, error: exErr } = await supabase
    .from("classes")
    .select("id, slug")
    .in("slug", slugs)
  if (exErr) throw exErr
  const classIdBySlug = new Map(existingClasses?.map((c) => [c.slug, c.id]))

  // Upsert classes
  for (const { klass } of byClass.values()) {
    if (classIdBySlug.has(klass.slug)) {
      if (commit) {
        const { error } = await supabase.from("classes").update({
          title: klass.title,
          description: klass.description,
          is_published: true,
        }).eq("slug", klass.slug)
        if (error) throw error
      }
      console.log(`Class: update '${klass.slug}'`)
    } else {
      if (commit) {
        const { data, error } = await supabase.from("classes").insert({
          title: klass.title,
          slug: klass.slug,
          description: klass.description,
          is_published: true,
        }).select("id").single()
        if (error) throw error
        classIdBySlug.set(klass.slug, data.id)
      } else {
        console.log(`Class: create '${klass.slug}'`)
      }
    }
  }

  // For each class, upsert modules then optionally purge unlisted
  for (const [slug, { modules }] of byClass.entries()) {
    const classId = classIdBySlug.get(slug)
    if (!classId) {
      // Fetch again in dry-run case where insert didn't run
      const { data: found } = await supabase.from("classes").select("id").eq("slug", slug).maybeSingle()
      if (!found?.id) {
        console.warn(`WARN: class id missing for '${slug}', skipping modules`)
        continue
      }
      byClass.get(slug).id = found.id
    }
    const cid = classIdBySlug.get(slug) || byClass.get(slug).id

    const desiredSlugs = new Set(modules.map((m) => m.slug))

    // Get existing modules for class
    const { data: existingMods, error: modErr } = await supabase
      .from("modules")
      .select("id, slug")
      .eq("class_id", cid)
    if (modErr) throw modErr
    const existsBySlug = new Map(existingMods?.map((m) => [m.slug, m.id]))

    for (const m of modules) {
      if (existsBySlug.has(m.slug)) {
        if (commit) {
          const { error } = await supabase
            .from("modules")
            .update({
              idx: m.idx,
              title: m.title,
              description: m.description,
              duration_minutes: m.duration_minutes,
              is_published: m.is_published ?? true,
            })
            .eq("class_id", cid)
            .eq("slug", m.slug)
          if (error) throw error
        }
        console.log(`  Module: update ${slug}/${m.slug} (#${m.idx})`)
      } else {
        if (commit) {
          const { error } = await supabase.from("modules").insert({
            class_id: cid,
            idx: m.idx,
            slug: m.slug,
            title: m.title,
            description: m.description,
            duration_minutes: m.duration_minutes,
            is_published: m.is_published ?? true,
          })
          if (error) throw error
        }
        console.log(`  Module: create ${slug}/${m.slug} (#${m.idx})`)
      }
    }

    if (purgeUnlisted) {
      // Delete modules not in desiredSlugs
      const toDelete = (existingMods || []).filter((m) => !desiredSlugs.has(m.slug)).map((m) => m.id)
      if (toDelete.length) {
        if (commit) {
          const { error } = await supabase.from("modules").delete().in("id", toDelete)
          if (error) throw error
        }
        console.log(`  Purged ${toDelete.length} unlisted modules from '${slug}'`)
      }
    }
  }

  console.log(commit ? "Import complete." : "Dry-run complete. No changes applied.")
}

main().catch((err) => {
  console.error("ERROR:", err?.message || err)
  process.exit(1)
})
