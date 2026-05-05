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

interface VoiceQuestStatusRow {
  id?: number | string | null;
}

interface ClaimDailyVoiceQuestRewardResultRow {
  total_points?: number | string | null;
  added_points?: number | string | null;
  daily_claim_count?: number | string | null;
  remaining_claims?: number | string | null;
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

export interface VoiceQuestStatusResult {
  completedToday: number;
  remainingToday: number;
  dailyLimit: number;
}

export interface ClaimDailyVoiceQuestRewardInput {
  walletAddress: string;
  questId: string;
  pointsToAdd: number;
  dailyLimit: number;
  expectedText: string;
  transcriptText: string;
}

export interface ClaimDailyVoiceQuestRewardResult {
  totalPoints: number;
  addedPoints: number;
  completedToday: number;
  remainingToday: number;
}

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const DEFAULT_TABLE_NAME = 'wallet_points';
const DEFAULT_WALLET_COLUMN = 'wallet_address';
const DEFAULT_POINTS_COLUMN = 'total_points';
const DEFAULT_ADD_POINTS_RPC = 'add_wallet_points';
const DEFAULT_CLAIM_QUEST_REWARD_RPC = 'claim_testnet_quest_reward';
const DEFAULT_VOICE_RECORDINGS_TABLE = 'testnet_voice_recordings';
const DEFAULT_CLAIM_DAILY_VOICE_REWARD_RPC = 'claim_testnet_daily_voice_reward';
const DEFAULT_VOICE_RECORDINGS_TIMESTAMP_COLUMNS = [
  'claimed_at',
  'created_at',
  'recorded_at',
] as const;
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
    voiceRecordingsTable: getIdentifier(
      process.env.TESTNET_VOICE_RECORDINGS_TABLE,
      DEFAULT_VOICE_RECORDINGS_TABLE,
      'TESTNET_VOICE_RECORDINGS_TABLE'
    ),
    claimDailyVoiceRewardRpc: getIdentifier(
      process.env.TESTNET_CLAIM_DAILY_VOICE_REWARD_RPC,
      DEFAULT_CLAIM_DAILY_VOICE_REWARD_RPC,
      'TESTNET_CLAIM_DAILY_VOICE_REWARD_RPC'
    ),
  };
}

function getVoiceQuestTimestampColumns() {
  const configuredColumns = process.env.TESTNET_VOICE_RECORDINGS_TIMESTAMP_COLUMNS
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const values = configuredColumns?.length
    ? [...configuredColumns, ...DEFAULT_VOICE_RECORDINGS_TIMESTAMP_COLUMNS]
    : [...DEFAULT_VOICE_RECORDINGS_TIMESTAMP_COLUMNS];

  return values.filter(
    (value, index, array) => IDENTIFIER_PATTERN.test(value) && array.indexOf(value) === index
  );
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

function getUtcDateRange() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

async function getVoiceQuestStatusCountForColumn(
  walletAddress: string,
  voiceRecordingsTable: string,
  timestampColumn: string,
  startIso: string,
  endIso: string
) {
  try {
    const response = await testnetWalletPointsFetch(
      `/rest/v1/${voiceRecordingsTable}?select=id&wallet_address=eq.${encodeURIComponent(
        walletAddress
      )}&${timestampColumn}=gte.${encodeURIComponent(startIso)}&${timestampColumn}=lt.${encodeURIComponent(
        endIso
      )}`,
      {
        method: 'GET',
        headers: {
          Prefer: 'count=exact',
        },
      }
    );

    const rows = (await response.json()) as VoiceQuestStatusRow[];
    return rows.length;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    const missingColumn =
      message.includes(`column ${timestampColumn.toLowerCase()}`) &&
      message.includes('does not exist');

    if (missingColumn) {
      return null;
    }

    throw error;
  }
}

export async function getDailyVoiceQuestStatus(
  walletAddress: string,
  dailyLimit: number
) {
  const normalizedWalletAddress = walletAddress.toLowerCase();
  const normalizedDailyLimit = Math.max(0, Math.trunc(dailyLimit));
  const { voiceRecordingsTable } = getTestnetWalletPointsConfig();
  const { startIso, endIso } = getUtcDateRange();
  const timestampColumns = getVoiceQuestTimestampColumns();
  let completedToday = 0;

  for (const timestampColumn of timestampColumns) {
    const count = await getVoiceQuestStatusCountForColumn(
      normalizedWalletAddress,
      voiceRecordingsTable,
      timestampColumn,
      startIso,
      endIso
    );

    if (typeof count === 'number') {
      completedToday = Math.max(completedToday, count);
    }

    if (completedToday >= normalizedDailyLimit) {
      break;
    }
  }

  return {
    completedToday,
    remainingToday: Math.max(normalizedDailyLimit - completedToday, 0),
    dailyLimit: normalizedDailyLimit,
  } satisfies VoiceQuestStatusResult;
}

export async function claimDailyVoiceQuestReward(
  input: ClaimDailyVoiceQuestRewardInput
) {
  const normalizedWalletAddress = input.walletAddress.toLowerCase();
  const normalizedQuestId = input.questId.trim().toLowerCase();
  const normalizedPointsToAdd = Math.trunc(input.pointsToAdd);
  const normalizedDailyLimit = Math.max(0, Math.trunc(input.dailyLimit));
  const { claimDailyVoiceRewardRpc } = getTestnetWalletPointsConfig();

  if (!normalizedQuestId) {
    throw new Error('Quest ID is required.');
  }

  if (normalizedPointsToAdd <= 0) {
    throw new Error('Points to add must be greater than zero.');
  }

  if (normalizedDailyLimit <= 0) {
    throw new Error('Daily limit must be greater than zero.');
  }

  const response = await testnetWalletPointsFetch(
    `/rest/v1/rpc/${claimDailyVoiceRewardRpc}`,
    {
      method: 'POST',
      body: JSON.stringify({
        p_wallet_address: normalizedWalletAddress,
        p_quest_id: normalizedQuestId,
        p_points_to_add: normalizedPointsToAdd,
        p_daily_limit: normalizedDailyLimit,
        p_expected_text: input.expectedText.trim(),
        p_transcript_text: input.transcriptText.trim(),
      }),
    }
  );

  const payload = (await response.json()) as
    | ClaimDailyVoiceQuestRewardResultRow
    | ClaimDailyVoiceQuestRewardResultRow[];
  const row = Array.isArray(payload) ? payload[0] : payload;
  const completedToday = Number(row?.daily_claim_count ?? 0);
  const remainingToday = Number(row?.remaining_claims ?? 0);

  return {
    totalPoints: Number(row?.total_points ?? 0),
    addedPoints: Number(row?.added_points ?? 0),
    completedToday,
    remainingToday,
  } satisfies ClaimDailyVoiceQuestRewardResult;
}
