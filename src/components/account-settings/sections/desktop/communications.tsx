import { CommunicationsPreferencesFields } from "@/components/account-settings/sections/communications-preferences-fields"

export function CommunicationsSection({
  marketingOptIn,
  newsletterOptIn,
  acceleratorOverlayEnabled,
  onMarketingOptInChange,
  onNewsletterOptInChange,
  onAcceleratorOverlayEnabledChange,
}: {
  marketingOptIn: boolean
  newsletterOptIn: boolean
  acceleratorOverlayEnabled: boolean
  onMarketingOptInChange: (value: boolean) => void
  onNewsletterOptInChange: (value: boolean) => void
  onAcceleratorOverlayEnabledChange: (value: boolean) => void
}) {
  return (
    <div className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold">Communications</h3>
        <p className="text-sm text-muted-foreground">Choose the updates you’d like to receive.</p>
      </header>
      <CommunicationsPreferencesFields
        idPrefix="desktop-communications"
        marketingOptIn={marketingOptIn}
        newsletterOptIn={newsletterOptIn}
        acceleratorOverlayEnabled={acceleratorOverlayEnabled}
        onMarketingOptInChange={onMarketingOptInChange}
        onNewsletterOptInChange={onNewsletterOptInChange}
        onAcceleratorOverlayEnabledChange={onAcceleratorOverlayEnabledChange}
      />
    </div>
  )
}
