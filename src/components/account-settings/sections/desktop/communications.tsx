import { CommunicationsPreferencesFields } from "@/components/account-settings/sections/communications-preferences-fields"

export function CommunicationsSection({
  marketingOptIn,
  newsletterOptIn,
  onMarketingOptInChange,
  onNewsletterOptInChange,
}: {
  marketingOptIn: boolean
  newsletterOptIn: boolean
  onMarketingOptInChange: (value: boolean) => void
  onNewsletterOptInChange: (value: boolean) => void
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
        onMarketingOptInChange={onMarketingOptInChange}
        onNewsletterOptInChange={onNewsletterOptInChange}
      />
    </div>
  )
}
