import Link from "next/link"

export function LegalConsentNotice() {
  return (
    <p className="text-muted-foreground text-center text-xs">
      By joining, you agree to our{" "}
      <Link
        href="/terms"
        target="_blank"
        rel="noreferrer"
        className="focus-visible:ring-ring rounded-sm underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
      >
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link
        href="/privacy"
        target="_blank"
        rel="noreferrer"
        className="focus-visible:ring-ring rounded-sm underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
      >
        Privacy Policy
      </Link>
    </p>
  )
}
