import { Button } from "@/components/ui/button"

export function DesktopFooter({
  justSaved,
  isDirty,
  isSaving,
  onSave,
  onClose,
  onDone,
}: {
  justSaved: boolean
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
  onClose: () => void
  onDone: () => void
}) {
  return (
    <div className="hidden items-center justify-end gap-2 border-t px-4 py-3 md:flex">
      <Button variant="outline" onClick={onClose}>{justSaved ? "Close" : "Cancel"}</Button>
      {justSaved ? (
        <Button onClick={onDone}>Done</Button>
      ) : (
        <Button onClick={onSave} disabled={isSaving || !isDirty}>{isSaving ? "Saving..." : "Save changes"}</Button>
      )}
    </div>
  )
}

