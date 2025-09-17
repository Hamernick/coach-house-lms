#!/usr/bin/env node
import { randomUUID } from "node:crypto"

import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey || !serviceRole) {
  console.log(
    "[supabase] Skipping RLS tests – set SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY."
  )
  process.exit(0)
}

const adminClient = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const suffix = randomUUID().slice(0, 8)
const studentEmail = `student-${suffix}@example.com`
const adminEmail = `admin-${suffix}@example.com`
const password = `TempPass!${suffix}`

async function ensureProfile(id, role, fullName) {
  const { error } = await adminClient.from("profiles").upsert(
    {
      id,
      role,
      full_name: fullName,
    },
    { onConflict: "id" }
  )
  if (error) throw error
}

async function createUsers() {
  const {
    data: { user: student },
    error: studentError,
  } = await adminClient.auth.admin.createUser({
    email: studentEmail,
    password,
    email_confirm: true,
  })
  if (studentError) throw studentError

  const {
    data: { user: admin },
    error: adminError,
  } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
  })
  if (adminError) throw adminError

  await ensureProfile(student.id, "student", "Test Student")
  await ensureProfile(admin.id, "admin", "Test Admin")

  return { student, admin }
}

async function createDemoContent(studentId) {
  const publishedClassId = randomUUID()
  const unpublishedClassId = randomUUID()
  const moduleId = randomUUID()
  const hiddenModuleId = randomUUID()

  const { error: classErr } = await adminClient.from("classes").insert([
    {
      id: publishedClassId,
      title: "Published Class",
      slug: `published-${suffix}`,
      description: "Visible to students",
      published: true,
    },
    {
      id: unpublishedClassId,
      title: "Draft Class",
      slug: `draft-${suffix}`,
      description: "Hidden from students",
      published: false,
    },
  ])
  if (classErr) throw classErr

  const { error: moduleErr } = await adminClient.from("modules").insert([
    {
      id: moduleId,
      class_id: publishedClassId,
      idx: 1,
      slug: `module-${suffix}`,
      title: "Kick-off",
      content_md: "# Kick-off",
    },
    {
      id: hiddenModuleId,
      class_id: unpublishedClassId,
      idx: 1,
      slug: `draft-module-${suffix}`,
      title: "Draft",
      content_md: "Hidden",
    },
  ])
  if (moduleErr) throw moduleErr

  const { error: enrollmentErr } = await adminClient.from("enrollments").insert({
    user_id: studentId,
    class_id: publishedClassId,
  })
  if (enrollmentErr) throw enrollmentErr

  return { publishedClassId, unpublishedClassId, moduleId, hiddenModuleId }
}

async function run() {
  const { student, admin } = await createUsers()
  const assets = await createDemoContent(student.id)

  const studentClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const adminSessionClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  await studentClient.auth.signInWithPassword({ email: studentEmail, password })
  await adminSessionClient.auth.signInWithPassword({ email: adminEmail, password })

  const results = []

  // Profile visibility
  {
    const { data, error } = await studentClient
      .from("profiles")
      .select("id")
      .eq("id", student.id)
      .maybeSingle()
    results.push({ name: "student reads own profile", passed: !!data && !error })

    const { data: otherProfile } = await studentClient
      .from("profiles")
      .select("id")
      .eq("id", admin.id)
      .maybeSingle()
    results.push({ name: "student cannot read other profile", passed: !otherProfile })
  }

  // Class visibility
  {
    const { data, error } = await studentClient.from("classes").select("id, published").order("published", { ascending: false })
    const publishedVisible = Array.isArray(data) && data.some((row) => row.id === assets.publishedClassId)
    const draftHidden = Array.isArray(data) && !data.some((row) => row.id === assets.unpublishedClassId)
    results.push({ name: "student sees published class", passed: publishedVisible && !error })
    results.push({ name: "student does not see draft class", passed: draftHidden })
  }

  // Class insertion RLS
  {
    const { error } = await studentClient.from("classes").insert({
      title: "Forbidden",
      slug: `forbidden-${suffix}`,
      published: true,
    })
    results.push({ name: "student cannot insert classes", passed: !!error })
  }

  // Admin update allowed
  {
    const { error } = await adminSessionClient
      .from("classes")
      .update({ title: "Published Class Updated" })
      .eq("id", assets.publishedClassId)
    results.push({ name: "admin can update classes", passed: !error })
  }

  // Module access + progress updates
  {
    const { data, error } = await studentClient.from("modules").select("id, class_id")
    const moduleVisible = Array.isArray(data) && data.some((row) => row.id === assets.moduleId)
    const draftHidden = Array.isArray(data) && !data.some((row) => row.id === assets.hiddenModuleId)
    results.push({ name: "student sees module for published class", passed: moduleVisible && !error })
    results.push({ name: "student does not see draft module", passed: draftHidden })

    const { error: progressErr } = await studentClient.from("module_progress").upsert({
      user_id: student.id,
      module_id: assets.moduleId,
      status: "in_progress",
    })
    results.push({ name: "student can upsert own module progress", passed: !progressErr })
  }

  // Subscription visibility
  {
    const subId = randomUUID()
    const { error } = await adminClient.from("subscriptions").insert({
      id: subId,
      user_id: student.id,
      stripe_subscription_id: `sub_${suffix}`,
      status: "active",
    })
    if (error) throw error

    const { data, error: subscriptionError } = await studentClient.from("subscriptions").select("id").maybeSingle()
    results.push({ name: "student can read own subscription", passed: !!data && !subscriptionError })

    const { error: updateError } = await studentClient
      .from("subscriptions")
      .update({ metadata: { source: "rls-test" } })
      .eq("id", subId)
    results.push({ name: "student can update own subscription metadata", passed: !updateError })
  }

  const failed = results.filter((result) => !result.passed)
  results.forEach((result) => {
    console.log(`${result.passed ? "✓" : "✗"} ${result.name}`)
  })

  await adminClient.from("module_progress").delete().eq("user_id", student.id)
  await adminClient.from("enrollments").delete().eq("user_id", student.id)
  await adminClient.from("modules").delete().in("id", [assets.moduleId, assets.hiddenModuleId])
  await adminClient.from("classes").delete().in("id", [assets.publishedClassId, assets.unpublishedClassId])
  await adminClient.from("subscriptions").delete().eq("user_id", student.id)
  await adminClient.auth.admin.deleteUser(student.id)
  await adminClient.auth.admin.deleteUser(admin.id)

  if (failed.length > 0) {
    console.error(`RLS tests failed (${failed.length}).`)
    process.exit(1)
  }

  console.log("RLS tests passed.")
}

run().catch((error) => {
  console.error("RLS test runner error:", error)
  process.exit(1)
})
