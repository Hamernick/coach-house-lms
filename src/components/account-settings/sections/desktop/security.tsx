import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleAccountConnection } from "@/features/google-auth"

export function SecuritySection({
  newPassword,
  confirmPassword,
  email,
  isUpdatingPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onUpdatePassword,
}: {
  newPassword: string
  confirmPassword: string
  email: string
  isUpdatingPassword: boolean
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onUpdatePassword: () => void
}) {
  const canSubmit =
    !isUpdatingPassword &&
    newPassword.length > 0 &&
    newPassword === confirmPassword

  return (
    <div className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold">Security</h3>
        <p className="text-muted-foreground text-sm">
          Manage your sign-in methods and password.
        </p>
      </header>
      <GoogleAccountConnection email={email} viewport="desktop" />
      <div className="grid max-w-xl gap-4">
        <h4 className="font-medium">Password</h4>
        <div className="grid gap-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.currentTarget.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.currentTarget.value)}
          />
        </div>
        <div>
          <Button onClick={onUpdatePassword} disabled={!canSubmit}>
            {isUpdatingPassword ? "Updating..." : "Update password"}
          </Button>
        </div>
      </div>
    </div>
  )
}
