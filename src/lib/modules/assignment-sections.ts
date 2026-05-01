import type { ModuleAssignmentField } from "./types"

export type AssignmentInfoBlock = {
  title?: string
  description?: string
}

export type AssignmentSection = {
  id: string
  title?: string
  description?: string
  infoBlocks?: AssignmentInfoBlock[]
  fields: ModuleAssignmentField[]
}

type AssignmentSectionsResult = {
  baseSections: AssignmentSection[]
  tabSections: AssignmentSection[]
}

export function buildAssignmentSections(fields: ModuleAssignmentField[]): AssignmentSectionsResult {
  const result: AssignmentSection[] = []
  const introBlocks: AssignmentInfoBlock[] = []
  let current: AssignmentSection | null = null

  fields.forEach((field) => {
    if (field.name === "origin_personal_why") {
      const dedicated: AssignmentSection = {
        id: "section-personal-why",
        title: field.label ?? "Your personal why",
        description: field.description,
        fields: [field],
      }
      result.push(dedicated)
      current = dedicated
      return
    }

    if (field.type === "subtitle") {
      if (field.screen === "intro") {
        introBlocks.push({
          title: field.label,
          description: field.description,
        })
        current = null
        return
      }

      current = {
        id: `section-${result.length + 1}`,
        title: field.label,
        description: field.description,
        fields: [],
      }
      result.push(current)
    } else if (field.screen === "question") {
      current = {
        id: `section-${result.length + 1}`,
        title: field.label,
        description: field.description,
        fields: [field],
      }
      result.push(current)
      current = null
    } else {
      if (!current) {
        current = {
          id: "section-0",
          fields: [],
        }
        result.push(current)
      }
      current.fields.push(field)
    }
  })

  if (introBlocks.length > 0) {
    result.unshift({
      id: "assignment-overview",
      title: "Overview",
      description: "Review the context and resources before answering the questions.",
      infoBlocks: introBlocks,
      fields: [],
    })
  }

  const baseSections = result.length
    ? result
    : [
        {
          id: "section-0",
          fields,
        },
      ]

  if (baseSections.length === 1 && baseSections[0]?.fields.length > 1 && !baseSections[0].title) {
    const tabs = baseSections[0].fields.map((field, idx) => ({
      id: `prompt-${idx}`,
      title: field.label || `Prompt ${idx + 1}`,
      description: field.description,
      fields: [field],
    }))
    return { baseSections, tabSections: tabs }
  }

  if (baseSections.length <= 1) {
    const flatFields = baseSections.flatMap((section) => section.fields)
    if (flatFields.length > 1) {
      const tabs = flatFields.map((field, idx) => ({
        id: `prompt-${idx}`,
        title: field.label || `Prompt ${idx + 1}`,
        description: field.description,
        fields: [field],
      }))
      return { baseSections, tabSections: tabs }
    }
  }

  return { baseSections, tabSections: baseSections }
}
