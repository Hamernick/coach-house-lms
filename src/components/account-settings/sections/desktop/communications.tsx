import { Label } from "@/components/ui/label"

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
      <div className="grid max-w-xl gap-4">
        <div className="flex items-start gap-3 rounded-md border p-3">
          <input id="marketing" type="checkbox" className="mt-0.5 h-4 w-4" checked={marketingOptIn} onChange={(e) => onMarketingOptInChange(e.currentTarget.checked)} />
          <div>
            <Label htmlFor="marketing" className="text-sm font-medium">
              Product communication
            </Label>
            <p className="text-sm text-muted-foreground">Updates about new features, tips, and offers.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-md border p-3">
          <input id="newsletter" type="checkbox" className="mt-0.5 h-4 w-4" checked={newsletterOptIn} onChange={(e) => onNewsletterOptInChange(e.currentTarget.checked)} />
          <div>
            <Label htmlFor="newsletter" className="text-sm font-medium">
              Weekly newsletter
            </Label>
            <p className="text-sm text-muted-foreground">Curated resources and Coach House news.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

