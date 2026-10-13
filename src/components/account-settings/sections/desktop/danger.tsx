import { Button } from "@/components/ui/button"

export function DangerSection({ onDeleteAccount }: { onDeleteAccount: () => void }) {
  return (
    <div className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold text-destructive">Danger zone</h3>
        <p className="text-sm text-muted-foreground">Delete your account and associated data.</p>
      </header>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm">This action is permanent and cannot be undone.</p>
        <div className="mt-3">
          <Button variant="destructive" onClick={onDeleteAccount}>Delete my account</Button>
        </div>
      </div>
    </div>
  )
}

