import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"

export default function FiscalSponsorshipSigningBreadcrumbs() {
  return (
    <AppBreadcrumbs
      segments={[
        { label: "Fiscal Sponsorship", href: "/my-organization" },
        { label: "Sign Agreement" },
      ]}
    />
  )
}
