set check_function_bodies = off;
set search_path = public;

-- Older workflow versions allowed Form B agreement files to be accepted as
-- supporting documents and allowed unverified uploads to satisfy the W-9 slot.
-- Return those records to an actionable review state without deleting evidence.
update public.fiscal_sponsorship_documents
set
  review_status = 'needs_info',
  review_notes = case
    when document_key = 'tax_id_confirmation'
      then 'Complete and sign the IRS Form W-9 in Coach House, or upload the correct signed W-9 PDF.'
    else 'This is a Form B agreement, not the supporting document requested for this requirement.'
  end,
  reviewed_at = timezone('utc', now()),
  updated_at = timezone('utc', now())
where review_status = 'accepted'
  and document_key is not null
  and (
    (
      document_key = 'tax_id_confirmation'
      and (kind <> 'tax_form' or status <> 'executed')
    )
    or lower(title) ~ '(^|[^a-z0-9])form[-_[:space:]]*b([^a-z0-9]|$)'
    or lower(title) like '%fiscal sponsorship agreement%'
  );
