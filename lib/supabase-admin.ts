import 'server-only';

export interface AllocationCheckRecord {
  walletAddress: string;
  txCount: number;
  isEligible: boolean;
  allocation: number;
}

interface AllocationCheckRow {
  wallet_address: string;
  tx_count: number | string;
  is_eligible: boolean;
  allocation: number | string;
}

export interface SpadminStats {
  totalWallets: number;
  totalSpkrChecked: number;
  eligibleWallets: number;
  totalTransactions: number;
  lastCheckedAt: string | null;
}

interface SpadminTotalsRow {
  total_wallets: number | string;
  total_spkr_checked: number | string;
  eligible_wallets: number | string;
  total_transactions: number | string;
  last_checked_at?: string | null;
}

const MISSING_CONFIG_ERROR =
  'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.';

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(MISSING_CONFIG_ERROR);
  }

  return {
    url: url.replace(/\/$/, ''),
    serviceRoleKey,
  };
}

async function supabaseAdminFetch(path: string, init: RequestInit = {}) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const headers = new Headers(init.headers);

  headers.set('apikey', serviceRoleKey);
  headers.set('Authorization', `Bearer ${serviceRoleKey}`);

  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${url}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${message}`);
  }

  return response;
}

export async function upsertAllocationCheck(check: AllocationCheckRecord) {
  await supabaseAdminFetch('/rest/v1/allocation_checks?on_conflict=wallet_address', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([
      {
        wallet_address: check.walletAddress.toLowerCase(),
        tx_count: check.txCount,
        is_eligible: check.isEligible,
        allocation: check.allocation,
        checked_at: new Date().toISOString(),
      },
    ]),
  });
}

export async function findAllocationCheck(walletAddress: string) {
  const normalizedWalletAddress = walletAddress.toLowerCase();
  const response = await supabaseAdminFetch(
    `/rest/v1/allocation_checks?select=wallet_address,tx_count,is_eligible,allocation&wallet_address=eq.${encodeURIComponent(
      normalizedWalletAddress
    )}&limit=1`,
    {
      method: 'GET',
    }
  );

  const rows = (await response.json()) as AllocationCheckRow[];
  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    walletAddress: row.wallet_address,
    txCount: Number(row.tx_count ?? 0),
    isEligible: Boolean(row.is_eligible),
    allocation: Number(row.allocation ?? 0),
  } satisfies AllocationCheckRecord;
}

export async function getSpadminStats(): Promise<SpadminStats> {
  const response = await supabaseAdminFetch(
    '/rest/v1/spadmin_totals?select=total_wallets,total_spkr_checked,eligible_wallets,total_transactions,last_checked_at&limit=1',
    {
      method: 'GET',
    }
  );

  const rows = (await response.json()) as SpadminTotalsRow[];
  const row = rows[0];

  return {
    totalWallets: Number(row?.total_wallets ?? 0),
    totalSpkrChecked: Number(row?.total_spkr_checked ?? 0),
    eligibleWallets: Number(row?.eligible_wallets ?? 0),
    totalTransactions: Number(row?.total_transactions ?? 0),
    lastCheckedAt: row?.last_checked_at ?? null,
  };
}
