import type { Json } from "./json"
import type { ResourceMapPublicItemsView } from "./views"

export type PublicFunctions = {
  complete_fiscal_sponsorship_w9_transition: {
    Args: {
      p_actor_id: string
      p_application_id: string
      p_document: Json
      p_expected_updated_at: string
    }
    Returns: Json
  }
  delete_organization_project_transition: {
    Args: {
      p_actor_id: string
      p_expected_org_id: string
      p_expected_updated_at: string
      p_project_id: string
    }
    Returns: Json
  }
  update_organization_project_schedule_transition: {
    Args: {
      p_actor_id: string
      p_end_date: string
      p_expected_org_id: string
      p_expected_updated_at: string
      p_project_id: string
      p_start_date: string
    }
    Returns: Json
  }
  update_organization_project_status_transition: {
    Args: {
      p_actor_id: string
      p_expected_org_id: string
      p_expected_updated_at: string
      p_project_id: string
      p_status: string
    }
    Returns: Json
  }
  update_organization_project_transition: {
    Args: {
      p_actor_id: string
      p_expected_org_id: string
      p_expected_updated_at: string
      p_has_overview_document: boolean
      p_overview_document_html: string | null
      p_overview_document_text: string | null
      p_project: Json
      p_project_id: string
    }
    Returns: Json
  }
  create_organization_project_transition: {
    Args: {
      p_actor_id: string
      p_has_overview_document: boolean
      p_org_id: string
      p_overview_document_html: string | null
      p_overview_document_text: string | null
      p_project: Json
    }
    Returns: Json
  }
  send_fiscal_sponsorship_form_b_transition: {
    Args: {
      p_actor_id: string
      p_applicant_signer_email: string
      p_applicant_signer_id: string
      p_applicant_signer_name: string
      p_application_id: string
      p_document_id: string
      p_expected_application_updated_at: string
      p_expected_document_updated_at: string
      p_fields: Json
      p_template_key: string
      p_template_sha256: string
      p_template_version: number
    }
    Returns: Json
  }
  generate_fiscal_sponsorship_form_b_transition: {
    Args: {
      p_actor_id: string
      p_application_id: string
      p_document: Json
      p_expected_updated_at: string
    }
    Returns: Json
  }
  delete_organization_task_transition: {
    Args: {
      p_actor_id: string
      p_expected_org_id: string
      p_expected_project_id: string
      p_task_id: string
    }
    Returns: Json
  }
  reorder_organization_tasks_transition: {
    Args: {
      p_actor_id: string
      p_expected_org_id: string
      p_ordered_task_ids: string[]
      p_project_id: string
    }
    Returns: Json
  }
  create_organization_task_transition: {
    Args: {
      p_actor_id: string
      p_assignee_id: string | null
      p_description: string | null
      p_end_date: string
      p_priority: string
      p_project_id: string
      p_start_date: string
      p_status: string
      p_tag_label: string | null
      p_task_type: string
      p_title: string
      p_workstream_name: string | null
    }
    Returns: Json
  }
  update_organization_task_transition: {
    Args: {
      p_actor_id: string
      p_assignee_id: string | null
      p_description: string | null
      p_end_date: string
      p_expected_org_id: string
      p_expected_project_id: string
      p_priority: string
      p_project_id: string
      p_start_date: string
      p_status: string
      p_tag_label: string | null
      p_task_id: string
      p_task_type: string
      p_title: string
      p_workstream_name: string | null
    }
    Returns: Json
  }
  save_fiscal_sponsorship_application_draft_transition: {
    Args: {
      p_actor_id: string
      p_allow_locked?: boolean
      p_budget_rows: Json
      p_budget_total_cents: number
      p_expected_updated_at: string | null
      p_has_budget_rows: boolean
      p_payload: Json
      p_project_id: string
      p_source_activity_id: string | null
    }
    Returns: Json
  }
  connect_fiscal_sponsorship_document_transition: {
    Args: {
      p_actor_id: string
      p_application_id: string
      p_asset_id: string
      p_document_key: string
      p_requirement_label: string
      p_title: string
    }
    Returns: Json
  }
  review_fiscal_sponsorship_document_transition: {
    Args: {
      p_actor_id: string
      p_application_id: string
      p_decision: string
      p_document_id: string
      p_expected_updated_at: string
      p_notes: string | null
    }
    Returns: Json
  }
  review_fiscal_sponsorship_application_transition: {
    Args: {
      p_actor_id: string
      p_application_id: string
      p_decision: string
      p_expected_updated_at: string
      p_notes: string | null
    }
    Returns: Json
  }
  submit_fiscal_sponsorship_application_transition: {
    Args: {
      p_actor_id: string
      p_application_id: string
      p_expected_updated_at: string
    }
    Returns: Json
  }
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
  set_organization_coach_assignments: {
    Args: {
      p_organization_id: string
      p_coach_user_ids: string[]
    }
    Returns: Json
  }
  assign_all_coaches_to_all_organizations: {
    Args: Record<string, never>
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
