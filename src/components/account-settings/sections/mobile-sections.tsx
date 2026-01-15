import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AccountSettingsMobilePage, AccountSettingsTabKey } from "../types"
import { OrganizationAccessManager } from "./organization-access-manager"

export const TAB_LABELS: Record<AccountSettingsTabKey, string> = {
  profile: "Profile",
  organization: "Organization",
  communications: "Communications",
  security: "Security",
  danger: "Danger zone",
}

export const MOBILE_LINKS: Array<{
  key: AccountSettingsTabKey
  description?: string
}> = [
  { key: "profile", description: "Personal details, photo" },
  { key: "organization", description: "Team access & permissions" },
  { key: "communications", description: "Emails & notifications" },
  { key: "security", description: "Password" },
  { key: "danger", description: "Delete account" },
]

export function MobileMenu({
  activeTab,
  hidden,
  onMobilePageChange,
  onTabChange,
}: {
  activeTab: AccountSettingsTabKey
  hidden: boolean
  onMobilePageChange: (page: AccountSettingsMobilePage) => void
  onTabChange: (tab: AccountSettingsTabKey) => void
}) {
  return (
    <div className="min-h-0 grow overflow-y-auto p-2 md:hidden" hidden={hidden}>
      <div className="px-2 pt-2 text-xs font-semibold text-muted-foreground">
        Account
      </div>
      <div className="mt-2 rounded-xl border bg-card/60">
        {MOBILE_LINKS.map((link, index) => (
          <button
            key={link.key}
            className={
              "flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm " +
              (index < MOBILE_LINKS.length - 1 ? "border-b" : "")
            }
            onClick={() => {
              onTabChange(link.key)
              onMobilePageChange(link.key)
            }}
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{TAB_LABELS[link.key]}</span>
              {link.description ? (
                <span className="text-xs text-muted-foreground">{link.description}</span>
              ) : null}
            </div>
            <span
              className={
                activeTab === link.key ? "text-xs uppercase tracking-wide text-primary" : "text-xs uppercase tracking-wide text-muted-foreground"
              }
            >
              Manage
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function MobileSubpage({
  tab,
  mobilePage,
  avatarUrl,
  firstName,
  lastName,
  phone,
  email,
  marketingOptIn,
  newsletterOptIn,
  newPassword,
  confirmPassword,
  orgName,
  isUploadingAvatar,
  onAvatarFileSelected,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onMarketingOptInChange,
  onNewsletterOptInChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onDeleteAccount,
}: {
  tab: AccountSettingsTabKey
  mobilePage: AccountSettingsMobilePage
  avatarUrl: string | null
  firstName: string
  lastName: string
  phone: string
  email: string
  marketingOptIn: boolean
  newsletterOptIn: boolean
  newPassword: string
  confirmPassword: string
  orgName: string
  isUploadingAvatar: boolean
  onAvatarFileSelected: (file?: File | null) => void
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onMarketingOptInChange: (value: boolean) => void
  onNewsletterOptInChange: (value: boolean) => void
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onDeleteAccount: () => void
}) {
  return (
    <div className="min-h-0 grow overflow-y-auto p-4 md:hidden" hidden={mobilePage === "menu"}>
      {tab === "profile" && (
        <div className="space-y-6">
          <header>
            <h3 className="text-sm font-semibold text-muted-foreground">Profile</h3>
          </header>
          <div className="max-w-xl space-y-6">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-4">
              <div
                className="relative size-16 overflow-hidden rounded-full border border-border bg-card"
                aria-busy={isUploadingAvatar}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                    {`${(firstName.charAt(0) || "A").toUpperCase()}${(lastName.charAt(0) || "A").toUpperCase()}`}
                  </div>
                )}
                {isUploadingAvatar ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <Loader2 className="size-6 animate-spin" aria-hidden />
                  </div>
                ) : null}
              </div>
              <Label htmlFor="avatarUploadMobile" className="text-xs text-muted-foreground">
                Upload a profile picture (optional)
              </Label>
              <Input
                id="avatarUploadMobile"
                type="file"
                accept="image/*"
                className="max-w-xs"
                disabled={isUploadingAvatar}
                onChange={(event) => onAvatarFileSelected(event.currentTarget.files?.[0] ?? null)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="m-first">First name</Label>
                <Input
                  id="m-first"
                  value={firstName}
                  onChange={(event) => onFirstNameChange(event.currentTarget.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="m-last">Last name</Label>
                <Input
                  id="m-last"
                  value={lastName}
                  onChange={(event) => onLastNameChange(event.currentTarget.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="m-phone">Phone</Label>
                <Input
                  id="m-phone"
                  value={phone}
                  onChange={(event) => onPhoneChange(event.currentTarget.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="m-email">Email</Label>
                <Input id="m-email" value={email} disabled />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "organization" && (
        <div className="space-y-6">
          <header>
            <h3 className="text-sm font-semibold text-muted-foreground">Organization</h3>
          </header>
          <OrganizationAccessManager organizationName={orgName} />
        </div>
      )}

      {tab === "communications" && (
        <div className="space-y-6">
          <header>
            <h3 className="text-sm font-semibold text-muted-foreground">Communications</h3>
          </header>
          <div className="grid max-w-xl gap-4">
            <div className="flex items-start gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={marketingOptIn}
                onChange={(event) => onMarketingOptInChange(event.currentTarget.checked)}
              />
              <div>
                <Label className="text-sm font-medium">Product communication</Label>
                <p className="text-sm text-muted-foreground">
                  Updates about new features, tips, and offers.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={newsletterOptIn}
                onChange={(event) => onNewsletterOptInChange(event.currentTarget.checked)}
              />
              <div>
                <Label className="text-sm font-medium">Weekly newsletter</Label>
                <p className="text-sm text-muted-foreground">
                  Curated resources and Coach House news.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="space-y-6">
          <header>
            <h3 className="text-sm font-semibold text-muted-foreground">Security</h3>
          </header>
          <div className="grid max-w-xl gap-4">
            <div className="grid gap-2">
              <Label htmlFor="m-newPassword">New password</Label>
              <Input
                id="m-newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => onNewPasswordChange(event.currentTarget.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-confirmPassword">Confirm password</Label>
              <Input
                id="m-confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => onConfirmPasswordChange(event.currentTarget.value)}
              />
            </div>
          </div>
        </div>
      )}

      {tab === "danger" && (
        <div className="space-y-6">
          <header>
            <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
          </header>
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm">This action is permanent and cannot be undone.</p>
            <div className="mt-3">
              <Button variant="destructive" onClick={onDeleteAccount}>
                Delete my account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
