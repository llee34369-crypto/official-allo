create table if not exists public.allocation_checks (
  wallet_address text primary key,
  tx_count integer not null default 0 check (tx_count >= 0),
  is_eligible boolean not null default false,
  allocation bigint not null default 0 check (allocation >= 0),
  checked_at timestamptz not null default timezone('utc', now())
);

create index if not exists allocation_checks_checked_at_idx
  on public.allocation_checks (checked_at desc);

alter table public.allocation_checks enable row level security;

create or replace view public.spadmin_totals as
select
  count(*)::bigint as total_wallets,
  coalesce(sum(allocation), 0)::bigint as total_spkr_checked,
  count(*) filter (where is_eligible)::bigint as eligible_wallets,
  max(checked_at) as last_checked_at
from public.allocation_checks;
