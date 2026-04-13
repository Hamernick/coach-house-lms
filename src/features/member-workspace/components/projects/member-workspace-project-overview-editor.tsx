"use client"

import type { ReactNode } from "react"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { MemberWorkspaceProjectDetailDraft } from "./member-workspace-project-detail-editing"

type MemberWorkspaceProjectOverviewEditorProps = {
  draft: MemberWorkspaceProjectDetailDraft
  onChangeDraftField: (
    field: keyof MemberWorkspaceProjectDetailDraft,
    value: string
  ) => void
}

function EditorPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "border-border/70 bg-card/80 rounded-2xl border p-4 shadow-sm sm:p-5",
        className
      )}
    >
      {children}
    </section>
  )
}

function MultilineField({
  field,
  hint,
  id,
  label,
  onChangeDraftField,
  placeholder,
  value,
}: {
  field: keyof MemberWorkspaceProjectDetailDraft
  hint?: string
  id: string
  label: string
  onChangeDraftField: (
    field: keyof MemberWorkspaceProjectDetailDraft,
    value: string
  ) => void
  placeholder?: string
  value: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        placeholder={placeholder}
        className="min-h-36 resize-y"
        onChange={(event) =>
          onChangeDraftField(field, event.currentTarget.value)
        }
      />
      {hint ? (
        <p className="text-muted-foreground text-xs leading-5">{hint}</p>
      ) : null}
    </div>
  )
}

export function MemberWorkspaceProjectOverviewEditor({
  draft,
  onChangeDraftField,
}: MemberWorkspaceProjectOverviewEditorProps) {
  return (
    <div className="space-y-6">
      <EditorPanel>
        <div className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            Project summary
          </h2>
          <p className="text-muted-foreground text-sm leading-6">
            Keep the main overview readable on desktop and mobile. Use short
            paragraphs or one sentence per line if you want line breaks
            preserved in the saved summary.
          </p>
        </div>
        <div className="mt-4">
          <MultilineField
            field="summary"
            id="member-workspace-project-summary"
            label="Summary"
            value={draft.summary}
            placeholder="Summarize the goal, current momentum, and what this project is expected to deliver."
            onChangeDraftField={onChangeDraftField}
          />
        </div>
      </EditorPanel>

      <EditorPanel>
        <div className="grid gap-6 md:grid-cols-2">
          <MultilineField
            field="scopeIn"
            id="member-workspace-project-scope-in"
            label="In scope"
            hint="One item per line."
            value={draft.scopeIn}
            placeholder={
              "Define deliverables\nApprove execution steps\nCoordinate assigned work"
            }
            onChangeDraftField={onChangeDraftField}
          />
          <MultilineField
            field="scopeOut"
            id="member-workspace-project-scope-out"
            label="Out of scope"
            hint="One item per line."
            value={draft.scopeOut}
            placeholder={
              "Unapproved scope changes\nWork outside the current backlog"
            }
            onChangeDraftField={onChangeDraftField}
          />
        </div>
      </EditorPanel>

      <EditorPanel>
        <div className="space-y-2">
          <h2 className="text-foreground text-base font-semibold">
            Outcomes and features
          </h2>
          <p className="text-muted-foreground text-sm leading-6">
            Outcomes and feature priorities are line-based so they can stack
            naturally on small screens without introducing extra controls.
          </p>
        </div>

        <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)]">
          <MultilineField
            field="outcomes"
            id="member-workspace-project-outcomes"
            label="Expected outcomes"
            hint="One item per line."
            value={draft.outcomes}
            placeholder={
              "Ship on time\nReduce delivery risk\nImprove team clarity"
            }
            onChangeDraftField={onChangeDraftField}
          />

          <div className="grid gap-6 md:grid-cols-3">
            <MultilineField
              field="keyFeaturesP0"
              id="member-workspace-project-features-p0"
              label="P0 features"
              hint="One item per line."
              value={draft.keyFeaturesP0}
              placeholder={"Critical workflow\nMust-have release work"}
              onChangeDraftField={onChangeDraftField}
            />
            <MultilineField
              field="keyFeaturesP1"
              id="member-workspace-project-features-p1"
              label="P1 features"
              hint="One item per line."
              value={draft.keyFeaturesP1}
              placeholder={"Important follow-up work\nSecondary improvements"}
              onChangeDraftField={onChangeDraftField}
            />
            <MultilineField
              field="keyFeaturesP2"
              id="member-workspace-project-features-p2"
              label="P2 features"
              hint="One item per line."
              value={draft.keyFeaturesP2}
              placeholder={"Nice-to-have polish\nFuture backlog items"}
              onChangeDraftField={onChangeDraftField}
            />
          </div>
        </div>
      </EditorPanel>
    </div>
  )
}
