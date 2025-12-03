import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  CommunicationsSection,
  DangerSection,
  DesktopFooter,
  OrganizationSection,
  ProfileSection,
  SecuritySection,
} from "./sections/desktop-sections"
import { SideLink } from "./sections/section-helpers"
import { MobileMenu, MobileSubpage, TAB_LABELS } from "./sections/mobile-sections"
import type {
  AccountSettingsErrorKey,
  AccountSettingsMobilePage,
  AccountSettingsTabKey,
} from "./types"

type AccountSettingsDialogShellProps = {
  open: boolean
  onOpenChange: (next: boolean) => void
  requestClose: () => void
  tab: AccountSettingsTabKey
  onTabChange: (tab: AccountSettingsTabKey) => void
  mobilePage: AccountSettingsMobilePage
  onMobilePageChange: (page: AccountSettingsMobilePage) => void
  isDirty: boolean
  isSaving: boolean
  justSaved: boolean
  marketingOptIn: boolean
  newsletterOptIn: boolean
  newPassword: string
  confirmPassword: string
  isUpdatingPassword: boolean
  firstName: string
  lastName: string
  phone: string
  email: string
  orgName: string
  orgDesc: string
  website: string
  social: string
  applyingAs: "individual" | "organization" | ""
  stage: string
  problem: string
  mission: string
  goals: string
  avatarUrl: string | null
  isUploadingAvatar: boolean
  errors: Partial<Record<AccountSettingsErrorKey, string>>
  onSave: () => void
  onUpdatePassword: () => void
  onDeleteAccount: () => void
  onAvatarFileSelected: (file?: File | null) => void
  onMarketingOptInChange: (value: boolean) => void
  onNewsletterOptInChange: (value: boolean) => void
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onOrgNameChange: (value: string) => void
  onOrgDescChange: (value: string) => void
  onWebsiteChange: (value: string) => void
  onSocialChange: (value: string) => void
  onApplyingAsChange: (value: "individual" | "organization") => void
  onStageChange: (value: string) => void
  onProblemChange: (value: string) => void
  onMissionChange: (value: string) => void
  onGoalsChange: (value: string) => void
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
}

export function AccountSettingsDialogShell({
  open,
  onOpenChange,
  requestClose,
  tab,
  onTabChange,
  mobilePage,
  onMobilePageChange,
  isDirty,
  isSaving,
  justSaved,
  marketingOptIn,
  newsletterOptIn,
  newPassword,
  confirmPassword,
  isUpdatingPassword,
  firstName,
  lastName,
  phone,
  email,
  orgName,
  orgDesc,
  website,
  social,
  applyingAs,
  stage,
  problem,
  mission,
  goals,
  avatarUrl,
  isUploadingAvatar,
  errors,
  onSave,
  onUpdatePassword,
  onDeleteAccount,
  onAvatarFileSelected,
  onMarketingOptInChange,
  onNewsletterOptInChange,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onOrgNameChange,
  onOrgDescChange,
  onWebsiteChange,
  onSocialChange,
  onApplyingAsChange,
  onStageChange,
  onProblemChange,
  onMissionChange,
  onGoalsChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
}: AccountSettingsDialogShellProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          onOpenChange(true)
        } else {
          requestClose()
        }
      }}
    >
      <DialogContent
        className={cn(
          "h-[92vh] w-full max-w-none overflow-hidden p-0 top-auto bottom-0 left-1/2 translate-x-[-50%] translate-y-0 rounded-t-2xl sm:w-[min(1120px,96%)] sm:max-w-[1120px] sm:rounded-lg sm:top-1/2 sm:bottom-auto sm:translate-y-[-50%]",
          mobilePage !== "menu"
            ? "[&_[data-slot=dialog-close]]:hidden md:[&_[data-slot=dialog-close]]:block"
            : undefined,
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="hidden border-b px-4 py-3 md:block">
            <DialogTitle>Account settings</DialogTitle>
            <DialogDescription>
              Manage your profile, security, and account preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="border-b px-4 py-3 md:hidden">
            <DialogTitle className="sr-only">Account settings</DialogTitle>
            {mobilePage === "menu" ? (
              <div className="text-center">
                <p className="text-base font-semibold">Settings</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  className="text-sm text-muted-foreground"
                  onClick={() => onMobilePageChange("menu")}
                >
                  Cancel
                </button>
                <p className="text-base font-semibold capitalize">
                  {TAB_LABELS[mobilePage]}
                </p>
                <button
                  className="text-sm text-primary disabled:opacity-50"
                  onClick={onSave}
                  disabled={!isDirty || isSaving}
                >
                  {isSaving ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className="hidden grow min-h-0 md:flex">
            <aside className="w-[240px] shrink-0 border-r p-4 md:p-6">
              <nav className="grid gap-1">
                <SideLink
                  label="Profile"
                  active={tab === "profile"}
                  onClick={() => onTabChange("profile")}
                />
                <SideLink
                  label="Organization"
                  active={tab === "organization"}
                  onClick={() => onTabChange("organization")}
                />
                <SideLink
                  label="Communications"
                  active={tab === "communications"}
                  onClick={() => onTabChange("communications")}
                />
                <SideLink
                  label="Security"
                  active={tab === "security"}
                  onClick={() => onTabChange("security")}
                />
                <Separator className="my-2" />
                <SideLink
                  label="Danger zone"
                  active={tab === "danger"}
                  onClick={() => onTabChange("danger")}
                  danger
                />
              </nav>
            </aside>
            <div className="flex grow min-h-0">
              <section className="w-full min-h-0 overflow-y-auto p-4 md:p-6">
                {tab === "profile" && (
                  <ProfileSection
                    avatarUrl={avatarUrl}
                    firstName={firstName}
                    lastName={lastName}
                    phone={phone}
                    email={email}
                    errors={errors}
                    isUploadingAvatar={isUploadingAvatar}
                    onAvatarFileSelected={onAvatarFileSelected}
                    onFirstNameChange={onFirstNameChange}
                    onLastNameChange={onLastNameChange}
                    onPhoneChange={onPhoneChange}
                  />
                )}

                {tab === "organization" && (
                  <OrganizationSection
                    orgName={orgName}
                    orgDesc={orgDesc}
                    website={website}
                    social={social}
                    applyingAs={applyingAs}
                    stage={stage}
                    problem={problem}
                    mission={mission}
                    goals={goals}
                    errors={errors}
                    onOrgNameChange={onOrgNameChange}
                    onOrgDescChange={onOrgDescChange}
                    onWebsiteChange={onWebsiteChange}
                    onSocialChange={onSocialChange}
                    onApplyingAsChange={onApplyingAsChange}
                    onStageChange={onStageChange}
                    onProblemChange={onProblemChange}
                    onMissionChange={onMissionChange}
                    onGoalsChange={onGoalsChange}
                  />
                )}

                {tab === "communications" && (
                  <CommunicationsSection
                    marketingOptIn={marketingOptIn}
                    newsletterOptIn={newsletterOptIn}
                    onMarketingOptInChange={onMarketingOptInChange}
                    onNewsletterOptInChange={onNewsletterOptInChange}
                  />
                )}

                {tab === "security" && (
                  <SecuritySection
                    newPassword={newPassword}
                    confirmPassword={confirmPassword}
                    isUpdatingPassword={isUpdatingPassword}
                    onNewPasswordChange={onNewPasswordChange}
                    onConfirmPasswordChange={onConfirmPasswordChange}
                    onUpdatePassword={onUpdatePassword}
                  />
                )}

                {tab === "danger" && (
                  <DangerSection onDeleteAccount={onDeleteAccount} />
                )}
              </section>
            </div>
          </div>

          <DesktopFooter
            justSaved={justSaved}
            isDirty={isDirty}
            isSaving={isSaving}
            onSave={onSave}
            onClose={requestClose}
            onDone={() => onOpenChange(false)}
          />

      <MobileMenu
        activeTab={tab}
        hidden={mobilePage !== "menu"}
        onMobilePageChange={onMobilePageChange}
        onTabChange={onTabChange}
      />

          <MobileSubpage
            tab={tab}
            mobilePage={mobilePage}
            avatarUrl={avatarUrl}
            firstName={firstName}
            lastName={lastName}
            phone={phone}
            email={email}
            marketingOptIn={marketingOptIn}
            newsletterOptIn={newsletterOptIn}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            orgName={orgName}
            orgDesc={orgDesc}
            website={website}
            social={social}
            applyingAs={applyingAs}
            stage={stage}
            problem={problem}
            mission={mission}
            goals={goals}
            isUploadingAvatar={isUploadingAvatar}
            onAvatarFileSelected={onAvatarFileSelected}
            onFirstNameChange={onFirstNameChange}
            onLastNameChange={onLastNameChange}
            onPhoneChange={onPhoneChange}
            onMarketingOptInChange={onMarketingOptInChange}
            onNewsletterOptInChange={onNewsletterOptInChange}
            onNewPasswordChange={onNewPasswordChange}
            onConfirmPasswordChange={onConfirmPasswordChange}
            onOrgNameChange={onOrgNameChange}
            onOrgDescChange={onOrgDescChange}
            onWebsiteChange={onWebsiteChange}
            onSocialChange={onSocialChange}
            onApplyingAsChange={onApplyingAsChange}
            onStageChange={onStageChange}
            onProblemChange={onProblemChange}
            onMissionChange={onMissionChange}
            onGoalsChange={onGoalsChange}
            onDeleteAccount={onDeleteAccount}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

