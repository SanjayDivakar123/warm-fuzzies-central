-- Allow proposal versioning to reuse the public slug while keeping one root proposal per slug.

alter table public.client_proposals
  drop constraint if exists client_proposals_status_check;

update public.client_proposals
set status = 'sent'
where status = 'active';

alter table public.client_proposals
  alter column status set default 'draft';

alter table public.client_proposals
  add constraint client_proposals_status_check
  check (status in ('draft', 'sent', 'viewed', 'accepted', 'rejected'));

alter table public.client_proposals
  drop constraint if exists client_proposals_slug_key;

create unique index if not exists client_proposals_root_slug_key
  on public.client_proposals (slug)
  where parent_proposal_id is null;

create unique index if not exists client_proposals_family_version_key
  on public.client_proposals ((coalesce(parent_proposal_id, id)), version);

create index if not exists client_proposals_slug_version_idx
  on public.client_proposals (slug, version desc, updated_at desc);
