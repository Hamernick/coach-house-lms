alter table public.google_drive_oauth_intents
drop constraint if exists google_drive_oauth_intents_return_path_check;

alter table public.google_drive_oauth_intents
add constraint google_drive_oauth_intents_return_path_check
check (return_path in (
  '/my-organization/documents',
  '/organization/documents',
  '/workspace/documents',
  '/workspace?drawer=tools'
));
