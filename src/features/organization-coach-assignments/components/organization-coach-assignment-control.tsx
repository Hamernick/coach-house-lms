"use client"

import {
  Check,
  CircleNotch,
  User,
  UserSwitch,
} from "@phosphor-icons/react/dist/ssr"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getOrganizationCoachInitials } from "../lib"
import type {
  OrganizationCoachAssignment,
  OrganizationCoachOption,
  UpdateOrganizationCoachAssignmentInput,
  UpdateOrganizationCoachAssignmentResult,
} from "../types"
import { useOrganizationCoachAssignmentController } from "../hooks/use-organization-coach-assignments-controller"

type AssignmentAction = (
  input: UpdateOrganizationCoachAssignmentInput
) => Promise<UpdateOrganizationCoachAssignmentResult>

function CoachAvatar({ coach }: { coach: OrganizationCoachOption | null }) {
  return (
    <Avatar className="border-border size-6 border">
      {coach?.avatarUrl ? (
        <AvatarImage src={coach.avatarUrl} alt={coach.name} />
      ) : null}
      <AvatarFallback className="text-[10px]">
        {coach ? getOrganizationCoachInitials(coach) : <User />}
      </AvatarFallback>
    </Avatar>
  )
}

export function OrganizationCoachAssignmentControl({
  assignment,
  canManage,
  coachOptions,
  organizationId,
  organizationName,
  updateAssignmentAction,
  canUnassign = true,
}: {
  assignment: OrganizationCoachAssignment | null
  canManage: boolean
  coachOptions: OrganizationCoachOption[]
  organizationId: string
  organizationName: string
  updateAssignmentAction?: AssignmentAction
  canUnassign?: boolean
}) {
  const controller = useOrganizationCoachAssignmentController({
    assignment,
    organizationId,
    updateAssignmentAction,
  })
  const coach = controller.assignment?.coach ?? null

  if (!canManage || !updateAssignmentAction) {
    return (
      <div
        className="text-muted-foreground flex min-h-9 items-center gap-2 text-xs"
        aria-label={`${organizationName} coach: ${coach?.name ?? "Unassigned"}`}
      >
        <CoachAvatar coach={coach} />
        <span>{coach?.name ?? "Unassigned"}</span>
      </div>
    )
  }

  return (
    <Popover open={controller.open} onOpenChange={controller.setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 max-w-48 justify-start gap-2 rounded-lg px-2 md:h-9"
          disabled={controller.pending}
          aria-busy={controller.pending}
          aria-label={`Assign a coach to ${organizationName}`}
        >
          <CoachAvatar coach={coach} />
          <span className="truncate">{coach?.name ?? "Assign coach"}</span>
          {controller.pending ? (
            <CircleNotch className="text-muted-foreground ml-auto animate-spin" />
          ) : (
            <UserSwitch className="text-muted-foreground ml-auto" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <p className="text-muted-foreground px-2 py-1 text-xs font-medium">
          Organization coach
        </p>
        {canUnassign ? (
          <button
            type="button"
            className={cn(
              "hover:bg-accent flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm",
              !coach && "bg-accent"
            )}
            onClick={() => controller.assign(null)}
          >
            <CoachAvatar coach={null} />
            <span>Unassigned</span>
            {!coach ? <Check className="ml-auto" /> : null}
          </button>
        ) : (
          <p className="text-muted-foreground px-2 py-2 text-xs">
            Assigned-only visibility is active. Choose another coach to reassign
            this organization.
          </p>
        )}
        {coachOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              "hover:bg-accent flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm",
              option.id === coach?.id && "bg-accent"
            )}
            onClick={() => controller.assign(option)}
          >
            <CoachAvatar coach={option} />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{option.name}</span>
              {option.email ? (
                <span className="text-muted-foreground block truncate text-xs">
                  {option.email}
                </span>
              ) : null}
            </span>
            {option.id === coach?.id ? <Check /> : null}
          </button>
        ))}
        {coachOptions.length === 0 ? (
          <p className="text-muted-foreground px-2 py-3 text-sm">
            No coach-level staff are available.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
