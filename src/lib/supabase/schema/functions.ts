import type { Json } from "./json"
import type { ResourceMapPublicItemsView } from "./views"

export type PublicFunctions = {
  finalize_fiscal_sponsorship_applicant_signature: {
    Args: {
      p_packet_id: string
      p_payload: Json
    }
    Returns: Json
  }
  finalize_fiscal_sponsorship_coach_signature: {
    Args: {
      p_packet_id: string
      p_payload: Json
    }
    Returns: Json
  }
  is_admin: {
    Args: Record<string, never>
    Returns: boolean
  }
  is_platform_staff: {
    Args: Record<string, never>
    Returns: boolean
  }
  current_platform_access_level: {
    Args: Record<string, never>
    Returns: string | null
  }
  set_organization_coach_scope_enabled: {
    Args: {
      p_enabled: boolean
    }
    Returns: Json
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
  get_resource_map_public_items: {
    Args: {
      p_query?: string | null
      p_category_keys?: string[] | null
      p_limit?: number | null
      p_latitude?: number | null
      p_longitude?: number | null
      p_radius_miles?: number | null
    }
    Returns: ResourceMapPublicItemsView["Row"][]
  }
}
