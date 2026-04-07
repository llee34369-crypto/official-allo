import { NextResponse } from 'next/server';
import { createPublicClient, http, isAddress } from 'viem';
import { bsc } from 'viem/chains';

import {
  calculateAllocationFromTxCount,
  SNAPSHOT_TIMESTAMP,
} from '@/lib/allocation-settings';
import {
  isSameOriginRequest,
  takeRateLimitToken,
} from '@/lib/request-security';
import {
  findAllocationCheck,
  isSupabaseConfigured,
  upsertAllocationCheck,
} from '@/lib/supabase-admin';

interface AllocationPayload {
  address?: unknown;
}

interface BscScanResponse<T> {
  status?: string;
  message?: string;
  result?: T;
}

const BSCSCAN_API_URL = 'https://api.bscscan.com/api';
const publicClient = createPublicClient({
  chain: bsc,
  transport: http(),
});

let snapshotBlockPromise: Promise<number> | null = null;

function getBscScanApiKey() {
  const apiKey =
    process.env.BSCSCAN_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_BSCSCAN_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('Missing BSCSCAN_API_KEY in the environment.');
  }

  return apiKey;
}

async function callBscScan<T>(params: Record<string, string>) {
  const searchParams = new URLSearchParams({
    ...params,
    apikey: getBscScanApiKey(),
  });

  const response = await fetch(`${BSCSCAN_API_URL}?${searchParams.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`BscScan request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as BscScanResponse<T>;

  if (payload.status === '0') {
    throw new Error(
      typeof payload.result === 'string'
        ? payload.result
        : payload.message || 'BscScan returned a NOTOK response.'
    );
  }

  if (
    typeof payload.result === 'string' &&
    payload.result.toLowerCase().includes('error')
  ) {
    throw new Error(payload.result);
  }

  if (payload.result == null) {
    throw new Error(payload.message || 'BscScan returned an empty result.');
  }

  return payload.result;
}

async function getSnapshotBlockNumberFromRpc() {
  const latestBlock = await publicClient.getBlock();
  let low = BigInt(0);
  let high = latestBlock.number;
  let best = BigInt(0);
  const targetTimestamp = BigInt(SNAPSHOT_TIMESTAMP);

  while (low <= high) {
    const mid = (low + high) / BigInt(2);
    const block = await publicClient.getBlock({ blockNumber: mid });

    if (block.timestamp <= targetTimestamp) {
      best = mid;
      low = mid + BigInt(1);
    } else {
      high = mid - BigInt(1);
    }
  }

  return Number(best);
}

async function getSnapshotBlockNumber() {
  if (snapshotBlockPromise) {
    return snapshotBlockPromise;
  }

  snapshotBlockPromise = (async () => {
    try {
      const result = await callBscScan<string>({
        module: 'block',
        action: 'getblocknobytime',
        timestamp: String(SNAPSHOT_TIMESTAMP),
        closest: 'before',
      });

      const parsedValue = Number(result);

      if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        throw new Error('Unable to resolve snapshot block number from BscScan.');
      }

      return parsedValue;
    } catch (error) {
      console.error('BscScan snapshot lookup failed, falling back to RPC:', error);
      return getSnapshotBlockNumberFromRpc();
    }
  })();

  try {
    return await snapshotBlockPromise;
  } catch (error) {
    snapshotBlockPromise = null;
    throw error;
  }
}

async function getTransactionCountAtBlock(walletAddress: string, blockNumber: number) {
  try {
    const result = await callBscScan<string>({
      module: 'proxy',
      action: 'eth_getTransactionCount',
      address: walletAddress,
      tag: `0x${blockNumber.toString(16)}`,
    });

    const parsedValue = Number(BigInt(result));

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      throw new Error('Unable to parse transaction count from BscScan.');
    }

    return parsedValue;
  } catch (error) {
    console.error('BscScan transaction count lookup failed, falling back to RPC:', error);
    const countBigInt = await publicClient.getTransactionCount({
      address: walletAddress as `0x${string}`,
      blockNumber: BigInt(blockNumber),
    });

    return Number(countBigInt);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const rateLimit = takeRateLimitToken(request, 'allocation-calc', 60);

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  let payload: AllocationPayload;

  try {
    payload = (await request.json()) as AllocationPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const walletAddress =
    typeof payload.address === 'string' ? payload.address.trim() : '';

  if (!isAddress(walletAddress)) {
    return NextResponse.json(
      { error: 'A valid wallet address is required.' },
      { status: 400 }
    );
  }

  try {
    if (isSupabaseConfigured()) {
      const existingCheck = await findAllocationCheck(walletAddress);

      if (existingCheck) {
        return NextResponse.json({
          ok: true,
          source: 'cache',
          ...existingCheck,
        });
      }
    }

    const snapshotBlockNumber = await getSnapshotBlockNumber();
    const txCount = await getTransactionCountAtBlock(
      walletAddress,
      snapshotBlockNumber
    );
    const allocationCheck = calculateAllocationFromTxCount(txCount);

    if (isSupabaseConfigured()) {
      await upsertAllocationCheck({
        walletAddress,
        txCount: allocationCheck.txCount,
        isEligible: allocationCheck.isEligible,
        allocation: allocationCheck.allocation,
      });
    }

    return NextResponse.json({
      ok: true,
      source: 'bscscan',
      snapshotBlockNumber,
      ...allocationCheck,
    });
  } catch (error) {
    console.error('Allocation lookup failed:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to calculate the allocation right now.',
      },
      { status: 500 }
    );
  }
}
