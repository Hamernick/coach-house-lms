set check_function_bodies = off;
set search_path = public;

-- Workspace storage has been fully migrated to table-backed state.
-- Remove legacy profile JSON keys to avoid stale duplicated sources of truth.
update organizations
set profile = (
  case
    when jsonb_typeof(profile::jsonb) = 'object'
      then (profile::jsonb - 'workspace_board_v1' - 'workspace_collaboration_v1')
    else profile::jsonb
  end
)
where jsonb_typeof(profile::jsonb) = 'object'
  and (
    profile::jsonb ? 'workspace_board_v1'
    or profile::jsonb ? 'workspace_collaboration_v1'
  );
