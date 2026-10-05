"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tag, Timer } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { EditableOptionPicker, type EditableOption } from "@/features/platform-admin-dashboard"
import { loadSharedProjectOptions, manageSharedProjectOption } from "../../project-workflow-actions"
import type { ProjectOptionSettings } from "../../lib/project-option-settings"
import { includeCurrentProjectHeaderOptions, parseProjectHeaderTags, replaceProjectHeaderTag } from "../../lib/project-header-options"
import { headerChipClassName, headerChipIconClassName } from "./member-workspace-project-detail-header-controls"

export function ProjectHeaderOptionPickers({ projectId, savedTags, savedType, tags, type, showType, onChangeTags, onChangeType, onBeginEdit }: {
  projectId: string
  savedTags: string
  savedType: string
  tags: string
  type: string
  showType: boolean
  onChangeTags: (value: string) => void
  onChangeType: (value: string) => void
  onBeginEdit: () => void
}) {
  const router = useRouter()
  const [settings, setSettings] = useState<ProjectOptionSettings | null>(null)
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setSettings(null)
    setError("")
    loadSharedProjectOptions().then((result) => {
      if (!active) return
      if ("error" in result) setError(result.error ?? "Unable to load project options.")
      else setSettings(includeCurrentProjectHeaderOptions(result.settings, savedTags, savedType))
    }).catch(() => { if (active) setError("Unable to load project options.") })
    return () => { active = false }
  }, [projectId, savedTags, savedType, retry])

  function picker(kind: "tag" | "sprintType", selectedLabel: string | null) {
    const options = settings?.[kind === "tag" ? "tags" : "sprintTypes"] ?? []
    const selected = options.find((option) => option.label.toLowerCase() === selectedLabel?.toLowerCase())
    const change = (label: string | null) => {
      if (kind === "tag") onChangeTags(replaceProjectHeaderTag(tags, selectedLabel, label))
      else onChangeType(label ?? "")
    }
    async function manage(action: "save" | "delete", option: EditableOption) {
      const existing = options.find((item) => item.id === option.id)
      const result = await manageSharedProjectOption({ action, kind, option })
      if ("error" in result) return result.error
      const saved = result.option
      if (!saved) return "Could not confirm the option change."
      const field = kind === "tag" ? "tags" : "sprintTypes"
      setSettings((current) => current ? {
        ...current,
        [field]: [...current[field].filter((item) => item.id !== option.id), ...(action === "save" ? [saved] : [])],
      } : current)
      if (kind === "tag") {
        if (existing && parseProjectHeaderTags(tags).some((tag) => tag.toLowerCase() === existing.label.toLowerCase())) {
          onChangeTags(replaceProjectHeaderTag(tags, existing.label, action === "delete" ? null : saved.label))
        } else if (!existing && action === "save") change(saved.label)
      } else if (existing?.label.toLowerCase() === type.toLowerCase() || (!existing && action === "save")) {
        onChangeType(action === "delete" ? "" : saved.label)
      }
      router.refresh()
    }
    return <EditableOptionPicker key={`${kind}:${selectedLabel ?? "add"}`} shared noun={kind === "tag" ? "tag" : "sprint type"}
      options={options} selectedId={selected?.id} onSelect={(option) => change(option?.label ?? null)}
      onSave={(option) => manage("save", option)} onDelete={(option) => manage("delete", option)}
      trigger={<Button type="button" variant="secondary" size="sm" className={headerChipClassName}
        disabled={!settings} onClick={onBeginEdit}
        aria-label={kind === "tag" ? selectedLabel ? `Tag: ${selectedLabel}` : "Add tag" : "Sprint type"}>
        {kind === "tag" ? <Tag className={headerChipIconClassName} aria-hidden /> : <Timer className={headerChipIconClassName} aria-hidden />}
        {selected?.color ? <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: selected.color }} aria-hidden /> : null}
        <span className="truncate">{selectedLabel || (kind === "tag" ? "Add tag" : "Sprint type")}</span>
      </Button>} />
  }

  return <>
    {showType ? picker("sprintType", type || null) : null}
    {parseProjectHeaderTags(tags).map((tag) => picker("tag", tag))}
    {picker("tag", null)}
    {error ? <span role="alert" className="text-destructive text-xs">{error} <Button type="button" variant="link" size="sm" onClick={() => setRetry((value) => value + 1)}>Retry</Button></span> : null}
  </>
}
