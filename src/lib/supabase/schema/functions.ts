import type { Json } from "./json"

export type PublicFunctions = {
  is_admin: {
    Args: Record<string, never>
    Returns: boolean
  }
  handle_updated_at: {
    Args: Record<string, never>
    Returns: unknown
  }
  apply_submission_to_organization: {
    Args: {
      p_user_id: string
      p_answers: Json
    }
    Returns: void
  }
  next_unlocked_module: {
    Args: {
      p_user_id: string
    }
    Returns: string | null
  }
  progress_for_class: {
    Args: {
      p_user_id: string
      p_class_id: string
    }
    Returns: {
      total: number | null
      completed: number | null
    }[]
  }
  search_global: {
    Args: {
      p_query: string
      p_user_id: string
      p_is_admin: boolean
      p_limit?: number | null
    }
    Returns: {
      id: string
      label: string
      subtitle: string | null
      href: string
      group_name: string
      rank: number | null
    }[]
  }
}
