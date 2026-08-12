import Link from "next/link"

import { Checkbox } from "@/components/ui/checkbox"

type LegalConsentFieldProps = {
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
  error?: string
}

export function LegalConsentField({
  checked,
  disabled,
  onCheckedChange,
  error,
}: LegalConsentFieldProps) {
  return (
    <div className="space-y-2">
      <label className="border-border/70 flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-3 text-sm leading-5">
        <Checkbox
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-invalid={Boolean(error)}
          className="mt-0.5"
        />
        <span>
          I agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="focus-visible:ring-ring rounded-sm underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
          >
            Terms of Service
          </Link>{" "}
          and acknowledge the{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="focus-visible:ring-ring rounded-sm underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
