create table if not exists public.testnet_whitelist (
  id bigserial primary key,
  wallet_address text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists testnet_whitelist_wallet_address_idx
  on public.testnet_whitelist (wallet_address);

alter table public.testnet_whitelist enable row level security;
