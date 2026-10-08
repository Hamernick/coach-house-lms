-- English text search removes IN, OR, ME and AS, so these state filters cannot
-- narrow the main GIN predicate by adding a state lexeme. Index just these
-- states to bound heap visits while retaining the existing exact state checks.
-- This small read-serving index writes directly, avoiding a pending-list scan
-- as filing descriptions are filled. Other indexes retain their settings.
-- Function-local custom plans allow their actual state predicates to imply
-- this partial-index predicate. No search/RLS/grant/deadline changes.
create index nonprofit_directory_stopword_state_search_idx
  on public.nonprofit_directory using gin(search_document)
  with (fastupdate=off)
  where suppressed_at is null and state in ('IN','OR','ME','AS');

-- Rollback: DROP INDEX public.nonprofit_directory_stopword_state_search_idx;
