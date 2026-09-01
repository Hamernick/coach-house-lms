"use client"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function OrganizationAccessPolicyControls({
  adminsCanInvite,
  staffCanManageCalendar,
  pending,
  onAdminsCanInviteChange,
  onStaffCanManageCalendarChange,
  className,
}: {
  adminsCanInvite: boolean
  staffCanManageCalendar: boolean
  pending: boolean
  onAdminsCanInviteChange: (next: boolean) => void
  onStaffCanManageCalendarChange: (next: boolean) => void
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="border-border/70 bg-background/40 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">
            Allow org admins to invite
          </p>
          <p className="text-muted-foreground text-sm">
            Admins can create and revoke team invite links.
          </p>
        </div>
        <Switch
          checked={adminsCanInvite}
          disabled={pending}
          onCheckedChange={onAdminsCanInviteChange}
          aria-label="Allow org admins to invite"
        />
      </div>

      <div className="border-border/70 bg-background/40 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">
            Allow staff to manage the roadmap calendar
          </p>
          <p className="text-muted-foreground text-sm">
            Staff can add and edit organization calendar events.
          </p>
        </div>
        <Switch
          checked={staffCanManageCalendar}
          disabled={pending}
          onCheckedChange={onStaffCanManageCalendarChange}
          aria-label="Allow staff to manage the roadmap calendar"
        />
      </div>
    </div>
  )
}
