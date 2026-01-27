import { OrganizationAccessManager } from "../organization-access-manager"

export type OrganizationSectionProps = {
  orgName: string
}

export function OrganizationSection({
  orgName,
}: OrganizationSectionProps) {
  return (
    <div className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold">Organization</h3>
        <p className="text-sm text-muted-foreground">Invite teammates and manage access.</p>
      </header>
      <OrganizationAccessManager organizationName={orgName} className="max-w-3xl" />
    </div>
  )
}
