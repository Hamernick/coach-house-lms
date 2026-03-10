import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type CommunicationsPreferencesFieldsProps = {
  marketingOptIn: boolean
  newsletterOptIn: boolean
  onMarketingOptInChange: (value: boolean) => void
  onNewsletterOptInChange: (value: boolean) => void
  idPrefix?: string
}

export function CommunicationsPreferencesFields({
  marketingOptIn,
  newsletterOptIn,
  onMarketingOptInChange,
  onNewsletterOptInChange,
  idPrefix = "communications",
}: CommunicationsPreferencesFieldsProps) {
  const marketingId = `${idPrefix}-marketing`
  const newsletterId = `${idPrefix}-newsletter`

  return (
    <div className="grid max-w-xl gap-4">
      <div className="flex items-start gap-3 rounded-md border p-3">
        <Checkbox
          id={marketingId}
          className="mt-0.5"
          checked={marketingOptIn}
          onCheckedChange={(checked) => onMarketingOptInChange(checked === true)}
        />
        <div>
          <Label htmlFor={marketingId} className="text-sm font-medium">
            Product communication
          </Label>
          <p className="text-sm text-muted-foreground">
            Updates about new features, tips, and offers.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-md border p-3">
        <Checkbox
          id={newsletterId}
          className="mt-0.5"
          checked={newsletterOptIn}
          onCheckedChange={(checked) => onNewsletterOptInChange(checked === true)}
        />
        <div>
          <Label htmlFor={newsletterId} className="text-sm font-medium">
            Weekly newsletter
          </Label>
          <p className="text-sm text-muted-foreground">
            Curated resources and Coach House news.
          </p>
        </div>
      </div>
    </div>
  )
}
