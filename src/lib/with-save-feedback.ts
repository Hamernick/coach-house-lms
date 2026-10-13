import { toast } from "@/lib/toast"

export const WORKSPACE_MUTATION_EVENT = "coach-house:workspace-saved"

/** A save is confirmed only after the action succeeds; failures preserve the editor. */
export async function withSaveFeedback<T extends { ok: true }>(
  save: () => Promise<T | { error: string } | undefined>,
  messages: { pending: string; success: string },
): Promise<T | { error: string }> {
  const id = toast.loading(messages.pending)
  let result: T | { error: string }
  try {
    result = (await save()) ?? { error: "Saving is unavailable. Please try again." }
  } catch {
    result = { error: "Could not confirm the save. Your changes are still here. Please try again." }
  }
  if ("error" in result) toast.error(result.error, { id })
  else {
    toast.success(messages.success, { id })
    if (typeof window !== "undefined") window.dispatchEvent(new Event(WORKSPACE_MUTATION_EVENT))
  }
  return result
}
