import Image from "next/image"

import { cn } from "@/lib/utils"

type StripePoweredBadgeProps = {
  className?: string
}

export function StripePoweredBadge({ className }: StripePoweredBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border border-border/70 bg-background/70 px-2 py-1",
        className,
      )}
      aria-label="Powered by Stripe"
    >
      <Image
        src="/brand/stripe/powered-by-stripe-black.svg"
        alt="Powered by Stripe"
        width={100}
        height={20}
        className="h-4 w-auto dark:hidden"
      />
      <Image
        src="/brand/stripe/powered-by-stripe-white.svg"
        alt="Powered by Stripe"
        width={100}
        height={20}
        className="hidden h-4 w-auto dark:block"
      />
    </span>
  )
}

