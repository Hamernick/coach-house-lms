-- Search selectivity changes with text, state, cursor and category. A reused
-- generic plan can scan far more of the national directory than a bounded page
-- needs. Scope parameter-aware planning to these two RPCs, including nested v1
-- calls from v2. Preserve deadlines, grants, visibility and result ordering.
alter function public.search_nonprofit_directory(text,text,text,integer)
  set plan_cache_mode = 'force_custom_plan';
alter function public.search_nonprofit_directory_v2(text,text,text,text,integer)
  set plan_cache_mode = 'force_custom_plan';

-- Rollback: ALTER FUNCTION each signature above RESET plan_cache_mode.
