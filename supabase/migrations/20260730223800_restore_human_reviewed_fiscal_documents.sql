set check_function_bodies = off;
set search_path = public;

-- Coach review is the authority for uploaded test documents. Restore only
-- records changed by the prior filename-based repair, preserving their assets
-- and reviewer.
update public.fiscal_sponsorship_documents
set
  kind = 'tax_form',
  status = 'executed',
  review_status = 'accepted',
  review_notes = null,
  reviewed_at = timezone('utc', now()),
  updated_at = timezone('utc', now())
where document_key = 'tax_id_confirmation'
  and review_status = 'needs_info'
  and review_notes =
    'Complete and sign the IRS Form W-9 in Coach House, or upload the correct signed W-9 PDF.'
  and asset_id is not null
  and mime = 'application/pdf';

update public.fiscal_sponsorship_documents
set
  review_status = 'accepted',
  review_notes = null,
  reviewed_at = timezone('utc', now()),
  updated_at = timezone('utc', now())
where review_status = 'needs_info'
  and review_notes =
    'This is a Form B agreement, not the supporting document requested for this requirement.';
