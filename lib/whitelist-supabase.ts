import 'server-only';

export interface WhitelistEntry {
  walletAddress: string;
  createdAt: string;
}

interface WhitelistRow {
  wallet_address: string;
  created_at: string;
}

const MISSING_CONFIG_ERROR =
  'Missing WHITELIST_SUPABASE_URL or WHITELIST_SUPABASE_SERVICE_ROLE_KEY in the environment.';

export function isWhitelistSupabaseConfigured() {
  return Boolean(
    process.env.WHITELIST_SUPABASE_URL &&
      process.env.WHITELIST_SUPABASE_SERVICE_ROLE_KEY
  );
}

function getWhitelistSupabaseConfig() {
  const url = process.env.WHITELIST_SUPABASE_URL?.trim();
  const serviceRoleKey =
    process.env.WHITELIST_SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(MISSING_CONFIG_ERROR);
  }

  return {
    url: url.replace(/\/$/, ''),
    serviceRoleKey,
  };
}

async function whitelistSupabaseFetch(path: string, init: RequestInit = {}) {
  const { url, serviceRoleKey } = getWhitelistSupabaseConfig();
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
    throw new Error(`Whitelist Supabase request failed (${response.status}): ${message}`);
  }

  return response;
}

export async function findWhitelistEntry(walletAddress: string) {
  const normalizedWalletAddress = walletAddress.toLowerCase();
  const response = await whitelistSupabaseFetch(
    `/rest/v1/testnet_whitelist?select=wallet_address,created_at&wallet_address=eq.${encodeURIComponent(
      normalizedWalletAddress
    )}&limit=1`,
    {
      method: 'GET',
    }
  );

  const rows = (await response.json()) as WhitelistRow[];
  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    walletAddress: row.wallet_address,
    createdAt: row.created_at,
  } satisfies WhitelistEntry;
}

export async function createWhitelistEntry(walletAddress: string) {
  const normalizedWalletAddress = walletAddress.toLowerCase();

  await whitelistSupabaseFetch('/rest/v1/testnet_whitelist', {
    method: 'POST',
    headers: {
      Prefer: 'return=minimal',
    },
    body: JSON.stringify([
      {
        wallet_address: normalizedWalletAddress,
      },
    ]),
  });
}

export async function getWhitelistEntryCount() {
  const response = await whitelistSupabaseFetch(
    '/rest/v1/testnet_whitelist?select=id',
    {
      method: 'GET',
    }
  );

  const rows = (await response.json()) as Array<{ id: number | string }>;
  return rows.length;
}
