import { clampText, MODULE_SUBTITLE_MAX_LENGTH, MODULE_TITLE_MAX_LENGTH } from "@/lib/lessons/limits"
import { createDefaultFormField } from "@/lib/lessons/fields"
import { inferProviderSlug } from "@/lib/lessons/providers"
import type { FormField, LessonLink, ModuleDefinition, Resource } from "@/lib/lessons/types"

function makeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

export type WizardDataState = {
  links: LessonLink[]
  modules: ModuleDefinition[]
}

export type WizardAction =
  | { type: "RESET" }
  | { type: "SET_ALL"; payload: { links: LessonLink[]; modules: ModuleDefinition[] } }
  | { type: "LINK_ADD" }
  | { type: "LINK_REMOVE"; payload: { id: string } }
  | { type: "LINK_UPDATE"; payload: { id: string; field: "title" | "url"; value: string } }
  | { type: "MODULE_ADD" }
  | { type: "MODULE_REMOVE"; payload: { index: number } }
  | { type: "MODULE_UPDATE_FIELD"; payload: { index: number; field: keyof ModuleDefinition; value: unknown } }
  | { type: "RESOURCE_ADD"; payload: { moduleIndex: number } }
  | { type: "RESOURCE_REMOVE"; payload: { moduleIndex: number; resourceId: string } }
  | { type: "RESOURCE_UPDATE"; payload: { moduleIndex: number; resourceId: string; field: "title" | "url"; value: string } }
  | { type: "FIELD_ADD"; payload: { moduleIndex: number } }
  | { type: "FIELD_REMOVE"; payload: { moduleIndex: number; fieldId: string } }
  | { type: "FIELD_UPDATE"; payload: { moduleIndex: number; fieldId: string; apply: (current: FormField) => FormField } }

export const initialWizardData: WizardDataState = {
  links: [],
  modules: [],
}

export function wizardReducer(state: WizardDataState, action: WizardAction): WizardDataState {
  switch (action.type) {
    case "RESET":
      return initialWizardData
    case "SET_ALL":
      return { links: action.payload.links, modules: action.payload.modules }

    case "LINK_ADD":
      return { ...state, links: [...state.links, { id: makeId(), title: "", url: "", providerSlug: "generic" }] }
    case "LINK_REMOVE":
      return { ...state, links: state.links.filter((l) => l.id !== action.payload.id) }
    case "LINK_UPDATE": {
      const { id, field, value } = action.payload
      const links = state.links.map((l) => {
        if (l.id !== id) return l
        const next = { ...l, [field]: value } as LessonLink
        if (field === "url") next.providerSlug = inferProviderSlug(value)
        return next
      })
      return { ...state, links }
    }

    case "MODULE_ADD":
      return {
        ...state,
        modules: [...state.modules, { id: makeId(), title: "", subtitle: "", body: "", videoUrl: "", resources: [], formFields: [] }],
      }
    case "MODULE_REMOVE": {
      const { index } = action.payload
      return { ...state, modules: state.modules.filter((_, i) => i !== index) }
    }
    case "MODULE_UPDATE_FIELD": {
      const { index, field, value } = action.payload
      const next = [...state.modules]
      const current = next[index]
      if (!current) return state
      let v: unknown = value
      if (typeof value === "string") {
        if (field === "title") v = clampText(value, MODULE_TITLE_MAX_LENGTH)
        else if (field === "subtitle") v = clampText(value, MODULE_SUBTITLE_MAX_LENGTH)
      }
      next[index] = { ...current, [field]: v } as ModuleDefinition
      return { ...state, modules: next }
    }

    case "RESOURCE_ADD": {
      const { moduleIndex } = action.payload
      const modules = [...state.modules]
      modules[moduleIndex] = {
        ...modules[moduleIndex],
        resources: [...modules[moduleIndex].resources, { id: makeId(), title: "", url: "", providerSlug: "generic" }],
      }
      return { ...state, modules }
    }
    case "RESOURCE_REMOVE": {
      const { moduleIndex, resourceId } = action.payload
      const modules = [...state.modules]
      modules[moduleIndex] = {
        ...modules[moduleIndex],
        resources: modules[moduleIndex].resources.filter((r) => r.id !== resourceId),
      }
      return { ...state, modules }
    }
    case "RESOURCE_UPDATE": {
      const { moduleIndex, resourceId, field, value } = action.payload
      const modules = [...state.modules]
      const updated = modules[moduleIndex].resources.map((r) => {
        if (r.id !== resourceId) return r
        const nr = { ...r, [field]: value } as Resource
        if (field === "url") nr.providerSlug = inferProviderSlug(value)
        return nr
      })
      modules[moduleIndex] = { ...modules[moduleIndex], resources: updated }
      return { ...state, modules }
    }

    case "FIELD_ADD": {
      const { moduleIndex } = action.payload
      const modules = [...state.modules]
      modules[moduleIndex] = {
        ...modules[moduleIndex],
        formFields: [...modules[moduleIndex].formFields, createDefaultFormField()],
      }
      return { ...state, modules }
    }
    case "FIELD_REMOVE": {
      const { moduleIndex, fieldId } = action.payload
      const modules = [...state.modules]
      modules[moduleIndex] = {
        ...modules[moduleIndex],
        formFields: modules[moduleIndex].formFields.filter((f) => f.id !== fieldId),
      }
      return { ...state, modules }
    }
    case "FIELD_UPDATE": {
      const { moduleIndex, fieldId, apply } = action.payload
      const modules = [...state.modules]
      const formFields = modules[moduleIndex].formFields.map((f) => (f.id === fieldId ? apply(f) : f))
      modules[moduleIndex] = { ...modules[moduleIndex], formFields }
      return { ...state, modules }
    }

    default:
      return state
  }
}

