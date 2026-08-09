type FiscalReviewerStaffMember = {
  access_level: "developer" | "coach"
  user_id: string
}

export function selectFiscalReviewerRecipientIds({
  assignments,
  excludeUserId,
  staff,
}: {
  assignments: Array<{ coach_user_id: string }>
  excludeUserId?: string | null
  staff: FiscalReviewerStaffMember[]
}) {
  const assignedCoachIds = new Set(
    assignments.map((assignment) => assignment.coach_user_id)
  )

  return [
    ...new Set(
      staff
        .filter(
          (member) =>
            member.access_level === "developer" ||
            (member.access_level === "coach" &&
              assignedCoachIds.has(member.user_id))
        )
        .map((member) => member.user_id)
    ),
  ].filter((userId) => userId !== excludeUserId)
}
