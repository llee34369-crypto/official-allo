import 'server-only';

interface WalletPointsRow {
  [key: string]: string | number | null | undefined;
}

interface AddWalletPointsResultRow {
  total_points?: number | string | null;
  added_points?: number | string | null;
}

interface ClaimQuestRewardResultRow {
  total_points?: number | string | null;
  added_points?: number | string | null;
  already_claimed?: boolean | null;
}

export interface WalletPointsEntry {
  walletAddress: string;
  totalPoints: number;
}

export interface AddWalletPointsResult {
  totalPoints: number;
  addedPoints: number;
}

export interface ClaimQuestRewardResult {
  totalPoints: number;
  addedPoints: number;
  alreadyClaimed: boolean;
}

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const DEFAULT_TABLE_NAME = 'wallet_points';
const DEFAULT_WALLET_COLUMN = 'wallet_address';
const DEFAULT_POINTS_COLUMN = 'total_points';
const DEFAULT_ADD_POINTS_RPC = 'add_wallet_points';
const DEFAULT_CLAIM_QUEST_REWARD_RPC = 'claim_testnet_quest_reward';
const MISSING_CONFIG_ERROR =
  'Missing TESTNET_POINTS_SUPABASE_URL or TESTNET_POINTS_SUPABASE_SERVICE_ROLE_KEY in the environment.';

export function isTestnetWalletPointsConfigured() {
  return Boolean(
    process.env.TESTNET_POINTS_SUPABASE_URL &&
      process.env.TESTNET_POINTS_SUPABASE_SERVICE_ROLE_KEY
  );
}

function getIdentifier(value: string | undefined, fallback: string, label: string) {
  const normalized = value?.trim() || fallback;

  if (!IDENTIFIER_PATTERN.test(normalized)) {
    throw new Error(`Invalid Supabase identifier for ${label}.`);
  }

  return normalized;
}

function getTestnetWalletPointsConfig() {
  const url = process.env.TESTNET_POINTS_SUPABASE_URL?.trim();
  const serviceRoleKey =
    process.env.TESTNET_POINTS_SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(MISSING_CONFIG_ERROR);
  }

  return {
    url: url.replace(/\/$/, ''),
    serviceRoleKey,
    tableName: getIdentifier(
      process.env.TESTNET_POINTS_TABLE,
      DEFAULT_TABLE_NAME,
      'TESTNET_POINTS_TABLE'
    ),
    walletColumn: getIdentifier(
      process.env.TESTNET_POINTS_WALLET_COLUMN,
      DEFAULT_WALLET_COLUMN,
      'TESTNET_POINTS_WALLET_COLUMN'
    ),
    pointsColumn: getIdentifier(
      process.env.TESTNET_POINTS_VALUE_COLUMN,
      DEFAULT_POINTS_COLUMN,
      'TESTNET_POINTS_VALUE_COLUMN'
    ),
    addPointsRpc: getIdentifier(
      process.env.TESTNET_ADD_POINTS_RPC,
      DEFAULT_ADD_POINTS_RPC,
      'TESTNET_ADD_POINTS_RPC'
    ),
    claimQuestRewardRpc: getIdentifier(
      process.env.TESTNET_CLAIM_QUEST_REWARD_RPC,
      DEFAULT_CLAIM_QUEST_REWARD_RPC,
      'TESTNET_CLAIM_QUEST_REWARD_RPC'
    ),
  };
}

async function testnetWalletPointsFetch(path: string, init: RequestInit = {}) {
  const { url, serviceRoleKey } = getTestnetWalletPointsConfig();
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
    throw new Error(
      `Testnet wallet points request failed (${response.status}): ${message}`
    );
  }

  return response;
}

export async function findWalletPoints(walletAddress: string) {
  const normalizedWalletAddress = walletAddress.toLowerCase();
  const { tableName, walletColumn, pointsColumn } =
    getTestnetWalletPointsConfig();
  const response = await testnetWalletPointsFetch(
    `/rest/v1/${tableName}?select=${walletColumn},${pointsColumn}&${walletColumn}=eq.${encodeURIComponent(
      normalizedWalletAddress
    )}&limit=1`,
    {
      method: 'GET',
    }
  );

  const rows = (await response.json()) as WalletPointsRow[];
  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    walletAddress: String(row[walletColumn] ?? normalizedWalletAddress),
    totalPoints: Number(row[pointsColumn] ?? 0),
  } satisfies WalletPointsEntry;
}

export async function addWalletPoints(walletAddress: string, pointsToAdd: number) {
  const normalizedWalletAddress = walletAddress.toLowerCase();
  const normalizedPointsToAdd = Math.trunc(pointsToAdd);
  const { addPointsRpc } = getTestnetWalletPointsConfig();

  if (normalizedPointsToAdd <= 0) {
    throw new Error('Points to add must be greater than zero.');
  }

  const response = await testnetWalletPointsFetch(`/rest/v1/rpc/${addPointsRpc}`, {
    method: 'POST',
    body: JSON.stringify({
      p_wallet_address: normalizedWalletAddress,
      p_points_to_add: normalizedPointsToAdd,
    }),
  });

  const payload = (await response.json()) as
    | AddWalletPointsResultRow
    | AddWalletPointsResultRow[];
  const row = Array.isArray(payload) ? payload[0] : payload;

  return {
    totalPoints: Number(row?.total_points ?? 0),
    addedPoints: Number(row?.added_points ?? 0),
  } satisfies AddWalletPointsResult;
}

export async function claimQuestReward(
  walletAddress: string,
  questId: string,
  pointsToAdd: number
) {
  const normalizedWalletAddress = walletAddress.toLowerCase();
  const normalizedQuestId = questId.trim().toLowerCase();
  const normalizedPointsToAdd = Math.trunc(pointsToAdd);
  const { claimQuestRewardRpc } = getTestnetWalletPointsConfig();

  if (!normalizedQuestId) {
    throw new Error('Quest ID is required.');
  }

  if (normalizedPointsToAdd <= 0) {
    throw new Error('Points to add must be greater than zero.');
  }

  const response = await testnetWalletPointsFetch(
    `/rest/v1/rpc/${claimQuestRewardRpc}`,
    {
      method: 'POST',
      body: JSON.stringify({
        p_wallet_address: normalizedWalletAddress,
        p_quest_id: normalizedQuestId,
        p_points_to_add: normalizedPointsToAdd,
      }),
    }
  );

  const payload = (await response.json()) as
    | ClaimQuestRewardResultRow
    | ClaimQuestRewardResultRow[];
  const row = Array.isArray(payload) ? payload[0] : payload;

  return {
    totalPoints: Number(row?.total_points ?? 0),
    addedPoints: Number(row?.added_points ?? 0),
    alreadyClaimed: Boolean(row?.already_claimed ?? false),
  } satisfies ClaimQuestRewardResult;
}
