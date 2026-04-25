create or replace function public.add_wallet_points(
  p_wallet_address text,
  p_points_to_add integer
)
returns table (
  total_points bigint,
  added_points integer
)
language plpgsql
security definer
as $$
declare
  normalized_wallet text := lower(trim(p_wallet_address));
  normalized_points integer := coalesce(p_points_to_add, 0);
  updated_total_points bigint := 0;
begin
  if normalized_wallet = '' then
    raise exception 'Wallet address is required.';
  end if;

  if normalized_points <= 0 then
    raise exception 'Points to add must be greater than zero.';
  end if;

  insert into public.wallet_points (
    wallet_address,
    total_points
  )
  values (
    normalized_wallet,
    normalized_points
  )
  on conflict (wallet_address) do update
    set total_points = public.wallet_points.total_points + normalized_points
  returning public.wallet_points.total_points into updated_total_points;

  return query
    select updated_total_points, normalized_points;
end;
$$;

create table if not exists public.wallet_quest_claims (
  id bigserial primary key,
  wallet_address text not null,
  quest_id text not null,
  claimed_at timestamptz not null default timezone('utc', now()),
  unique (wallet_address, quest_id)
);

create index if not exists wallet_quest_claims_wallet_address_idx
  on public.wallet_quest_claims (wallet_address);

create index if not exists wallet_quest_claims_quest_id_idx
  on public.wallet_quest_claims (quest_id);

create or replace function public.claim_testnet_quest_reward(
  p_wallet_address text,
  p_quest_id text,
  p_points_to_add integer
)
returns table (
  total_points bigint,
  added_points integer,
  already_claimed boolean
)
language plpgsql
security definer
as $$
declare
  normalized_wallet text := lower(trim(p_wallet_address));
  normalized_quest_id text := lower(trim(p_quest_id));
  normalized_points integer := coalesce(p_points_to_add, 0);
  quest_inserted boolean := false;
  updated_total_points bigint := 0;
begin
  if normalized_wallet = '' then
    raise exception 'Wallet address is required.';
  end if;

  if normalized_quest_id = '' then
    raise exception 'Quest ID is required.';
  end if;

  if normalized_points <= 0 then
    raise exception 'Points to add must be greater than zero.';
  end if;

  insert into public.wallet_quest_claims (
    wallet_address,
    quest_id
  )
  values (
    normalized_wallet,
    normalized_quest_id
  )
  on conflict (wallet_address, quest_id) do nothing;

  quest_inserted := found;

  if quest_inserted then
    insert into public.wallet_points (
      wallet_address,
      total_points
    )
    values (
      normalized_wallet,
      normalized_points
    )
    on conflict (wallet_address) do update
      set total_points = public.wallet_points.total_points + normalized_points
    returning public.wallet_points.total_points into updated_total_points;

    return query
      select updated_total_points, normalized_points, false;
  end if;

  select coalesce(wp.total_points, 0)
    into updated_total_points
  from public.wallet_points wp
  where wp.wallet_address = normalized_wallet
  limit 1;

  return query
    select updated_total_points, 0, true;
end;
$$;

alter table if exists public.wallet_points enable row level security;
alter table if exists public.wallet_quest_claims enable row level security;

grant select on table public.wallet_points to anon;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'wallet_points'
      and policyname = 'Allow anon read wallet points'
  ) then
    create policy "Allow anon read wallet points"
      on public.wallet_points
      for select
      to anon
      using (true);
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wallet_points'
  ) then
    alter publication supabase_realtime add table public.wallet_points;
  end if;
end;
$$;
