export const PERSON_CATEGORY_META = {
  staff: {
    label: "Staff",
    badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-200 border-sky-500/30",
    stripClass: "bg-sky-500",
    dotClass: "bg-sky-500",
  },
  governing_board: {
    label: "Governing Board",
    badgeClass: "bg-violet-500/15 text-violet-700 dark:text-violet-200 border-violet-500/30",
    stripClass: "bg-violet-500",
    dotClass: "bg-violet-500",
  },
  advisory_board: {
    label: "Advisory Board",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-200 border-amber-500/30",
    stripClass: "bg-amber-500",
    dotClass: "bg-amber-500",
  },
  volunteers: {
    label: "Volunteers",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/30",
    stripClass: "bg-emerald-500",
    dotClass: "bg-emerald-500",
  },
  supporters: {
    label: "Supporters",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-200 border-rose-500/30",
    stripClass: "bg-rose-500",
    dotClass: "bg-rose-500",
  },
} as const

export type PersonCategory = keyof typeof PERSON_CATEGORY_META

export const PERSON_CATEGORY_OPTIONS = (Object.keys(PERSON_CATEGORY_META) as PersonCategory[]).map(
  (key) => ({
    value: key,
    label: PERSON_CATEGORY_META[key].label,
  }),
)

export function normalizePersonCategory(input: string | null | undefined): PersonCategory {
  const value = (input ?? "").toLowerCase().trim()
  if (value.includes("advisory")) return "advisory_board"
  if (value.includes("governing")) return "governing_board"
  if (value.startsWith("board")) return "governing_board"
  if (value.includes("supporter")) return "supporters"
  if (value.includes("foundation")) return "supporters"
  if (value.includes("corporate")) return "supporters"
  if (value.includes("sponsor")) return "supporters"
  if (value.includes("funder")) return "supporters"
  if (value.startsWith("volunteer")) return "volunteers"
  if (value.startsWith("support")) return "volunteers"
  return "staff"
}
