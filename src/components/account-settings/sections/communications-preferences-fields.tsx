import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type CommunicationsPreferencesFieldsProps = {
  marketingOptIn: boolean
  newsletterOptIn: boolean
  acceleratorOverlayEnabled: boolean
  onMarketingOptInChange: (value: boolean) => void
  onNewsletterOptInChange: (value: boolean) => void
  onAcceleratorOverlayEnabledChange: (value: boolean) => void
  idPrefix?: string
}

export function CommunicationsPreferencesFields({
  marketingOptIn,
  newsletterOptIn,
  acceleratorOverlayEnabled,
  onMarketingOptInChange,
  onNewsletterOptInChange,
  onAcceleratorOverlayEnabledChange,
  idPrefix = "communications",
}: CommunicationsPreferencesFieldsProps) {
  const marketingId = `${idPrefix}-marketing`
  const newsletterId = `${idPrefix}-newsletter`
  const acceleratorOverlayId = `${idPrefix}-accelerator-overlay`

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
      <div className="flex items-start gap-3 rounded-md border p-3">
        <Checkbox
          id={acceleratorOverlayId}
          className="mt-0.5"
          checked={acceleratorOverlayEnabled}
          onCheckedChange={(checked) => onAcceleratorOverlayEnabledChange(checked === true)}
        />
        <div>
          <Label htmlFor={acceleratorOverlayId} className="text-sm font-medium">
            Accelerator overlay
          </Label>
          <p className="text-sm text-muted-foreground">
            Show the accelerator card on the organization workspace canvas.
          </p>
        </div>
      </div>
    </div>
  )
}
