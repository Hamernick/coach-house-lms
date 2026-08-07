import { isOrganizationActivityKind } from "@/lib/organization/primary-objects"

export type ProgramWizardSnapshot = Record<string, unknown>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function mergeProgramWizardSnapshot({
  existing,
  incoming,
}: {
  existing: unknown
  incoming: unknown
}):
  | { success: true; snapshot: ProgramWizardSnapshot }
  | { success: false; error: string; field: "wizardSnapshot" } {
  if (incoming == null) {
    return { success: true, snapshot: {} }
  }

  if (!isRecord(incoming)) {
    return {
      success: false,
      error: "Program builder data must be an object.",
      field: "wizardSnapshot",
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(incoming, "objectKind") &&
    !isOrganizationActivityKind(incoming.objectKind)
  ) {
    return {
      success: false,
      error: "Choose a supported activity type.",
      field: "wizardSnapshot",
    }
  }

  return {
    success: true,
    snapshot: {
      ...(isRecord(existing) ? existing : {}),
      ...incoming,
    },
  }
}
