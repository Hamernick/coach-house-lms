import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function readMigration(fileName: string) {
  return readFileSync(
    join(process.cwd(), "supabase/migrations", fileName),
    "utf8"
  )
}

const auditMigration = readMigration(
  "20260806009000_preserve_project_activity_history.sql"
)
const projectDeletionMigration = readMigration(
  "20260806007000_atomic_organization_project_deletion.sql"
)
const taskDeletionMigration = readMigration(
  "20260805235500_atomic_organization_task_deletion.sql"
)

describe("member workspace project audit integrity", () => {
  it("preserves project history after deletion", () => {
    expect(auditMigration).toContain(
      "drop constraint if exists organization_project_activity_events_project_id_fkey"
    )
    expect(auditMigration).toContain("on delete set null")
    expect(auditMigration).toContain("'deleted'")
    expect(auditMigration).toContain("v_project_id := null")
    expect(auditMigration).toContain("where project.id = old.project_id")
    expect(auditMigration).toContain("after insert or delete or update of")
  })

  it("records content, status, schedule, and deletion events", () => {
    expect(auditMigration).toContain("v_event_kind := 'updated'")
    expect(auditMigration).toContain("v_event_kind := 'scheduled'")
    expect(auditMigration).toContain("v_event_kind := 'deleted'")
    expect(auditMigration).toContain("when new.status = 'completed'")
    expect(auditMigration).toContain("when new.status = 'done'")
    expect(auditMigration).toContain("record_organization_project_activity")
    expect(auditMigration).toContain("record_organization_task_activity")
  })

  it("attributes deletion events to the requesting actor", () => {
    expect(projectDeletionMigration).toContain(
      "update public.organization_projects\n  set updated_by = p_actor_id"
    )
    expect(taskDeletionMigration).toContain(
      "update public.organization_tasks\n  set updated_by = p_actor_id"
    )
    expect(auditMigration).toContain(
      "v_actor_id := coalesce(old.updated_by, old.created_by)"
    )
  })

  it("keeps audit writes server-owned", () => {
    expect(auditMigration).not.toContain(
      "grant insert on public.organization_project_activity_events"
    )
    expect(auditMigration).not.toContain("to anon")
  })
})
