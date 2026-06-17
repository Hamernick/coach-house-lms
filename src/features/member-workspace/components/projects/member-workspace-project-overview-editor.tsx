"use client"

import { RichTextEditor } from "@/components/rich-text-editor"
import { Label } from "@/components/ui/label"
import type { MemberWorkspaceProjectDetailDraft } from "./member-workspace-project-detail-editing"
import { MEMBER_WORKSPACE_PROJECT_OVERVIEW_EDITOR_CLASS_NAME } from "./member-workspace-project-overview-typography"

type MemberWorkspaceProjectOverviewEditorProps = {
  draft: MemberWorkspaceProjectDetailDraft
  onChangeDraftField: (
    field: keyof MemberWorkspaceProjectDetailDraft,
    value: string
  ) => void
}

export function MemberWorkspaceProjectOverviewEditor({
  draft,
  onChangeDraftField,
}: MemberWorkspaceProjectOverviewEditorProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <Label>Overview document</Label>
      <RichTextEditor
        value={draft.overviewDocument}
        onChange={(value) => onChangeDraftField("overviewDocument", value)}
        ariaLabel="Organization overview document"
        placeholder="Draft the overview, scope, outcomes, requirements, links, tables, and notes…"
        minHeight={520}
        stableScrollbars
        className="border-border/60 bg-background shadow-none"
        toolbarClassName="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        countClassName="border-b border-border/60 bg-muted/20"
        editorClassName={MEMBER_WORKSPACE_PROJECT_OVERVIEW_EDITOR_CLASS_NAME}
      />
    </section>
  )
}
