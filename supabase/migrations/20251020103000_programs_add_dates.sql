set check_function_bodies = off;
set search_path = public;

-- Add start/end dates to programs (idempotent)
alter table programs add column if not exists start_date timestamptz;
alter table programs add column if not exists end_date timestamptz;

