import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function PricingCallToActionSection() {
  return (
    <section>
      <Card className="relative overflow-hidden rounded-3xl border border-border/70">
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-8 py-14 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Ready to start building?</h2>
          <Button asChild className="rounded-xl px-8">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </Card>
    </section>
  )
}
