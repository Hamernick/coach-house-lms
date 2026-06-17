set check_function_bodies = off;
set search_path = public;

alter table public.fiscal_sponsorship_documents
  add column if not exists document_key text,
  add column if not exists review_status text not null default 'pending',
  add column if not exists uploaded_by uuid references public.profiles(id) on delete set null,
  add column if not exists uploaded_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fiscal_sponsorship_documents_document_key_check'
  ) then
    alter table public.fiscal_sponsorship_documents
      add constraint fiscal_sponsorship_documents_document_key_check
      check (
        document_key is null
        or document_key in (
          'tax_id_confirmation',
          'governing_documents',
          'formation_or_good_standing',
          'budget_support',
          'fundraising_materials',
          'insurance',
          'grant_request_support',
          'grantee_report',
          'closeout_report',
          'additional_info'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'fiscal_sponsorship_documents_review_status_check'
  ) then
    alter table public.fiscal_sponsorship_documents
      add constraint fiscal_sponsorship_documents_review_status_check
      check (
        review_status in (
          'pending',
          'accepted',
          'needs_info',
          'rejected',
          'not_required'
        )
      );
  end if;
end $$;

create index if not exists fiscal_sponsorship_documents_application_document_key_idx
  on public.fiscal_sponsorship_documents (application_id, document_key, created_at desc);

create index if not exists fiscal_sponsorship_documents_org_project_review_status_idx
  on public.fiscal_sponsorship_documents (org_id, project_id, review_status);

drop policy if exists "fiscal_sponsorship_documents_insert"
  on public.fiscal_sponsorship_documents;

create policy "fiscal_sponsorship_documents_insert"
on public.fiscal_sponsorship_documents
for insert
to authenticated
with check (
  (
    public.is_admin()
    or (
      kind in ('application', 'regrant')
      and document_key is not null
      and review_status = 'pending'
      and uploaded_by = (select auth.uid())
      and (
        org_id = (select auth.uid())
        or exists (
          select 1
          from public.organization_memberships om
          where om.org_id = fiscal_sponsorship_documents.org_id
            and om.member_id = (select auth.uid())
            and om.role in ('owner', 'admin', 'staff')
        )
      )
    )
  )
  and exists (
    select 1
    from public.organization_projects op
    where op.id = fiscal_sponsorship_documents.project_id
      and op.org_id = fiscal_sponsorship_documents.org_id
  )
  and (
    asset_id is null
    or exists (
      select 1
      from public.organization_project_assets opa
      where opa.id = fiscal_sponsorship_documents.asset_id
        and opa.project_id = fiscal_sponsorship_documents.project_id
        and opa.org_id = fiscal_sponsorship_documents.org_id
    )
  )
);
