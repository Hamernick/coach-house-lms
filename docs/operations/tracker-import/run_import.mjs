#!/usr/bin/env node
/** Explicit operator entry point. Default is read-only reconciliation. Never logs credentials or source payloads. */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { parseEnv } from 'node:util'
import { isDeepStrictEqual } from 'node:util'

const [manifestPath, expectedHash, envPath, operation = 'reconcile'] = process.argv.slice(2)
if (!manifestPath || !expectedHash || !envPath || !['apply', 'reconcile', 'rollback'].includes(operation)) {
  throw new Error('Usage: node run_import.mjs MANIFEST EXPECTED_SHA256 ENV_FILE [reconcile|apply|rollback]')
}
const raw = readFileSync(manifestPath, 'utf8')
if (createHash('sha256').update(raw).digest('hex') !== expectedHash) throw new Error('Manifest hash differs from reviewed manifest')
const manifest = JSON.parse(raw)
const env = parseEnv(readFileSync(envPath, 'utf8'))
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key || new URL(url).hostname !== 'vswzhuwjtgzrkxknrmxu.supabase.co') throw new Error('Expected linked Coach House backend credentials')

async function request(path, body) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(`Database request failed (${response.status}): ${data.code ?? 'unknown'}; inspect privately before retrying`)
  return data
}
function equal(actual, expected, label) {
  if (!isDeepStrictEqual(actual, expected)) throw new Error(`Reconciliation mismatch: ${label}`)
}

if (operation === 'rollback') {
  console.log(JSON.stringify(await request('rpc/rollback_task_tracker_batch', { p_batch_id: manifest.batchId })))
} else {
  if (operation === 'apply') {
    console.log(JSON.stringify(await request('rpc/import_task_tracker_batch', { p_manifest_text: raw })))
  }
  const parentIds = manifest.projects.map(p => p.id).join(',')
  const [batches, ledger, projects, tasks, notes, assignments] = await Promise.all([
    request(`task_tracker_import_batches?id=eq.${manifest.batchId}&select=id,status,manifest_hash`),
    request(`task_tracker_import_records?batch_id=eq.${manifest.batchId}&select=*&limit=1000`),
    request(`organization_projects?id=in.(${parentIds})&select=*&limit=1000`),
    request(`organization_tasks?project_id=in.(${parentIds})&select=*&limit=1000`),
    request(`organization_project_notes?project_id=in.(${parentIds})&select=*&limit=1000`),
    request(`organization_task_assignees?org_id=eq.${manifest.orgId}&select=task_id,user_id&limit=1000`),
  ])
  equal(batches, [{ id: manifest.batchId, status: 'complete', manifest_hash: expectedHash }], 'batch state/hash')
  equal(ledger.length, manifest.records.length + manifest.auxiliaryRecords.length, 'ledger count')
  for (const row of [...manifest.records, ...manifest.auxiliaryRecords]) {
    const saved = ledger.find(r => r.entity_type === row.entityType && r.source_id === row.sourceId)
    if (!saved) throw new Error(`Missing ledger record: ${row.entityType}/${row.sourceId}`)
    equal(saved.source_payload, row.source, `source payload ${row.sourceId}`)
    equal(saved.disposition, row.disposition, `disposition ${row.sourceId}`)
    equal(saved.destination_id, row.destinationId, `destination ${row.sourceId}`)
  }
  equal(projects.length, manifest.projects.length, 'project count')
  equal(tasks.length, manifest.tasks.length, 'task count')
  equal(notes.length, manifest.notes.length, 'reference count')
  for (const row of manifest.projects) {
    const saved = projects.find(p => p.id === row.id)
    if (!saved) throw new Error(`Missing project: ${row.id}`)
    for (const [db, field] of Object.entries({ name: 'name', description: 'description', status: 'status', priority: 'priority', start_date: 'startDate', end_date: 'endDate', tags: 'tags', member_labels: 'members', tracker_metadata: 'tracker' })) equal(saved[db], row[field], `project ${row.id}/${db}`)
    const children = manifest.tasks.filter(t => t.projectId === row.id)
    equal(saved.task_count, children.length, `project count ${row.id}`)
    equal(saved.progress, children.length ? Math.round(100 * children.filter(t => t.status === 'done').length / children.length) : 0, `project progress ${row.id}`)
  }
  for (const row of manifest.tasks) {
    const saved = tasks.find(t => t.id === row.id)
    if (!saved) throw new Error(`Missing task: ${row.id}`)
    for (const [db, field] of Object.entries({ project_id: 'projectId', title: 'title', description: 'description', status: 'status', priority: 'priority', start_date: 'startDate', end_date: 'endDate', tag_label: 'workArea', tracker_metadata: 'tracker' })) equal(saved[db], row[field], `task ${row.id}/${db}`)
    equal(assignments.filter(a => a.task_id === row.id).map(a => a.user_id), row.assigneeId ? [row.assigneeId] : [], `assignment ${row.id}`)
  }
  for (const row of manifest.notes) {
    const saved = notes.find(n => n.id === row.id)
    equal(saved?.content, row.content, `reference ${row.id}`)
    equal(saved?.title, row.title, `reference title ${row.id}`)
  }
  console.log(JSON.stringify({ reconciled: true, sourceRecords: manifest.records.length, projects: projects.length, tasks: tasks.length, referenceNotes: notes.length }))
}
