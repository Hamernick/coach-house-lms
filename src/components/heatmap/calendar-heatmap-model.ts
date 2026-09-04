import type { Locale, Day as WeekDay } from "date-fns"
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  formatISO,
  getDay,
  getMonth,
  getYear,
  nextDay,
  parseISO,
  subWeeks,
} from "date-fns"

export type Activity = {
  date: string
  value: number
}

export type ActivityWithLevel = Activity & {
  level: number
}

export type Week = Array<ActivityWithLevel | undefined>

export type YearRow = {
  year: number
  startMonth: number
  weeks: Week[]
}

export type Labels = {
  months?: string[]
  weekdays?: string[]
  stat?: string // Stat text template. Placeholders: {{value}}, {{year}}
  cellLabel?: string // aria-label template. Placeholders: {{date}}, {{value}}
  heatmapLabel?: string // aria-label for the heatmap SVG. Placeholder: {{year}}
  legendLabel?: string // aria-label for the legend fieldset
  legendLevelLabel?: string // aria-label template for legend swatches. Placeholder: {{level}}
}

export type ColorConfig = {
  empty?: string
  scale?: string
}

type MonthLabel = {
  weekIndex: number
  label: string
  year?: number
}

// Non-normalized: 1 empty + (levels-1) colored steps. Normalized: levels colored steps, no empty.
export const colorStepCount = (levels: number, isNormalized: boolean) =>
  Math.max(1, isNormalized ? levels : levels - 1)

export const getLevelFill = (
  level: number,
  levels: number,
  isNormalized: boolean,
  highlighted = false,
  colors?: ColorConfig
): string => {
  const emptyColor = colors?.empty ?? "var(--color-secondary)"
  const scaleColor = colors?.scale ?? "var(--color-chart-1)"

  if (level === 0) return emptyColor
  const steps = colorStepCount(levels, isNormalized)
  const opacity =
    steps === 1 ? 100 : Math.round(20 + ((level - 1) * 80) / (steps - 1))
  const finalOpacity = highlighted ? Math.round(opacity * 0.6) : opacity
  return `color-mix(in oklch, ${scaleColor} ${finalOpacity}%, transparent)`
}

export const calculateLevel = (
  value: number,
  minValue: number,
  maxValue: number,
  levels: number,
  isNormalized: boolean
): number => {
  const steps = colorStepCount(levels, isNormalized)
  if (!Number.isFinite(value)) return isNormalized ? 1 : 0
  if (isNormalized) {
    if (maxValue <= minValue) return 1
    const percentage = (value - minValue) / (maxValue - minValue)
    return Math.max(1, Math.min(steps, Math.ceil(percentage * steps)))
  }
  if (value <= 0 || maxValue <= 0) return 0
  const percentage = value / maxValue
  return Math.max(1, Math.min(steps, Math.ceil(percentage * steps)))
}

export const generateMonthLabels = (locale?: Locale): string[] => {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1)
    if (locale) return format(date, "LLL", { locale })
    return date.toLocaleString("en-US", { month: "short" })
  })
}

export const generateWeekdayLabels = (locale?: Locale): string[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2000, 0, 2 + i)
    if (locale) return format(date, "EEE", { locale })
    return date.toLocaleString("en-US", { weekday: "short" })
  })
}

const fillHoles = (activities: ActivityWithLevel[]): ActivityWithLevel[] => {
  if (activities.length === 0) {
    return []
  }

  const sortedActivities = [...activities].sort((a, b) =>
    a.date.localeCompare(b.date)
  )

  const calendar = new Map<string, ActivityWithLevel>(
    activities.map((a) => [a.date, a])
  )

  const firstActivity = sortedActivities[0] as ActivityWithLevel
  const lastActivity = sortedActivities.at(-1)

  if (!lastActivity) {
    return []
  }

  return eachDayOfInterval({
    start: parseISO(firstActivity.date),
    end: parseISO(lastActivity.date),
  }).map((day) => {
    const date = formatISO(day, { representation: "date" })

    if (calendar.has(date)) {
      return calendar.get(date) as ActivityWithLevel
    }

    return {
      date,
      value: 0,
      level: 0,
    }
  })
}

export const groupByYearAndMonth = (
  activities: ActivityWithLevel[],
  weekStart: WeekDay = 0,
  hasEmptyColumn = false
): YearRow[] => {
  if (activities.length === 0) {
    return []
  }

  const normalizedActivities = fillHoles(activities)

  const activitiesByYearMonth = new Map<string, ActivityWithLevel[]>()

  for (const activity of normalizedActivities) {
    const date = parseISO(activity.date)
    const year = getYear(date)
    const month = getMonth(date)
    const key = `${year}-${String(month).padStart(2, "0")}`

    if (!activitiesByYearMonth.has(key)) {
      activitiesByYearMonth.set(key, [])
    }
    activitiesByYearMonth.get(key)?.push(activity)
  }

  const sortedKeys = Array.from(activitiesByYearMonth.keys()).sort()

  if (sortedKeys.length === 0) {
    return []
  }

  const firstKey = sortedKeys[0]
  const [firstYearStr, firstMonthStr] = firstKey.split("-")
  const startYear = parseInt(firstYearStr, 10)
  const startMonth = parseInt(firstMonthStr, 10)

  const yearRows: YearRow[] = []
  let currentYear = startYear
  let currentMonth = startMonth

  while (true) {
    const rowWeeks: Week[] = []
    let hasData = false

    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const monthIndex = (currentMonth + monthOffset) % 12
      const yearOffset = Math.floor((currentMonth + monthOffset) / 12)
      const year = currentYear + yearOffset
      const key = `${year}-${String(monthIndex).padStart(2, "0")}`

      const monthActivities = activitiesByYearMonth.get(key) || []

      if (monthActivities.length > 0) {
        hasData = true

        const firstActivity = monthActivities[0] as ActivityWithLevel
        const firstDate = parseISO(firstActivity.date)
        const firstCalendarDate =
          getDay(firstDate) === weekStart
            ? firstDate
            : subWeeks(nextDay(firstDate, weekStart), 1)

        const paddedActivities: Array<ActivityWithLevel | undefined> = [
          ...new Array(
            differenceInCalendarDays(firstDate, firstCalendarDate)
          ).fill(undefined),
          ...monthActivities,
        ]

        const numberOfWeeks = Math.ceil(paddedActivities.length / 7)
        const monthWeeks: Week[] = new Array(numberOfWeeks)
          .fill(undefined)
          .map((_, weekIndex) =>
            paddedActivities.slice(weekIndex * 7, weekIndex * 7 + 7)
          )

        if (hasEmptyColumn && rowWeeks.length > 0) {
          rowWeeks.push(new Array(7).fill(undefined) as Week)
        }

        rowWeeks.push(...monthWeeks)
      }
    }

    if (!hasData) {
      break
    }

    yearRows.push({
      year: currentYear,
      startMonth: currentMonth,
      weeks: rowWeeks,
    })

    currentYear++
    currentMonth = startMonth

    const hasNextYearData = sortedKeys.some((key) => {
      const [yearStr] = key.split("-")
      return parseInt(yearStr, 10) >= currentYear
    })

    if (!hasNextYearData) {
      break
    }
  }

  return yearRows
}

export const groupContinuous = (
  activities: ActivityWithLevel[],
  weekStart: WeekDay = 0
): YearRow[] => {
  if (activities.length === 0) return []

  const normalizedActivities = fillHoles(activities)

  const first = normalizedActivities[0] as ActivityWithLevel
  const firstDate = parseISO(first.date)
  const firstCalendarDate =
    getDay(firstDate) === weekStart
      ? firstDate
      : subWeeks(nextDay(firstDate, weekStart), 1)

  const leadingPad = differenceInCalendarDays(firstDate, firstCalendarDate)

  const padded: Array<ActivityWithLevel | undefined> = [
    ...new Array(leadingPad).fill(undefined),
    ...normalizedActivities,
  ]

  const numberOfWeeks = Math.ceil(padded.length / 7)
  const allWeeks: Week[] = new Array(numberOfWeeks)
    .fill(undefined)
    .map((_, i) => padded.slice(i * 7, i * 7 + 7))

  return [
    {
      year: getYear(firstDate),
      startMonth: getMonth(firstDate),
      weeks: allWeeks,
    },
  ]
}

export const getMonthLabels = (
  weeks: Week[],
  monthNames: string[] = generateMonthLabels()
): MonthLabel[] => {
  return weeks
    .reduce<MonthLabel[]>((labels, week, weekIndex) => {
      const firstActivity = week.find((activity) => activity !== undefined)

      if (!firstActivity) {
        return labels
      }

      const month = monthNames[getMonth(parseISO(firstActivity.date))]

      if (!month) {
        const monthName = new Date(firstActivity.date).toLocaleString("en-US", {
          month: "short",
        })
        throw new Error(
          `Unexpected error: undefined month label for ${monthName}.`
        )
      }

      const prevLabel = labels.at(-1)

      if (weekIndex === 0 || !prevLabel || prevLabel.label !== month) {
        return labels.concat({ weekIndex, label: month })
      }

      return labels
    }, [])
    .filter(({ weekIndex }, index, labels) => {
      const minWeeks = 3

      if (index === 0) {
        return labels[1] && labels[1].weekIndex - weekIndex >= minWeeks
      }

      if (index === labels.length - 1) {
        return weeks.slice(weekIndex).length >= minWeeks
      }

      return true
    })
}
