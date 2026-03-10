import { Button } from "@/components/ui/button"

export function DesktopFooter({
  justSaved,
  isDirty,
  isSaving,
  onSave,
  onDone,
}: {
  justSaved: boolean
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
  onDone: () => void
}) {
  return (
    <div className="hidden items-center justify-end gap-2 border-t px-4 py-3 md:flex">
      {justSaved ? (
        <Button onClick={onDone}>Done</Button>
      ) : (
        <Button onClick={onSave} disabled={isSaving || !isDirty}>{isSaving ? "Saving..." : "Save changes"}</Button>
      )}
    </div>
  )
}
