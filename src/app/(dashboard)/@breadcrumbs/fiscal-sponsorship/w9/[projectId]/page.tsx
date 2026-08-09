import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"

export default function FiscalSponsorshipW9Breadcrumbs() {
  return (
    <AppBreadcrumbs
      segments={[
        { label: "Fiscal Sponsorship", href: "/my-organization" },
        { label: "Complete W-9" },
      ]}
    />
  )
}
