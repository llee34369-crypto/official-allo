import Link from 'next/link';
import {
  ArrowLeft,
  Coins,
  Database,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from 'lucide-react';

import { getSpadminStats, isSupabaseConfigured } from '@/lib/supabase-admin';
import {
  isSpadminAuthenticated,
  isSpadminConfigured,
} from '@/lib/spadmin-auth';

export const dynamic = 'force-dynamic';

const numberFormatter = new Intl.NumberFormat('en-US');

interface AdminStats {
  totalWallets: number;
  totalSpkrChecked: number;
  eligibleWallets: number;
  totalTransactions: number;
  lastCheckedAt: string | null;
}

const emptyStats: AdminStats = {
  totalWallets: 0,
  totalSpkrChecked: 0,
  eligibleWallets: 0,
  totalTransactions: 0,
  lastCheckedAt: null,
};

function formatErrorMessage(error: string | string[] | undefined) {
  const value = Array.isArray(error) ? error[0] : error;

  if (value === 'invalid-password') {
    return 'That password was not correct.';
  }

  if (value === 'config') {
    return 'SPADMIN_PASSWORD is missing in your .env.';
  }

  return null;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'No checks yet';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function LoginCard({ error }: { error: string | null }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-brand-red selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[38%] w-[38%] rounded-full bg-brand-red/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[34%] w-[34%] rounded-full bg-brand-red/10 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center">
            <Link
              href="/"
              className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/80 transition-all hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.45em] text-brand-red-glow">
              SpeakerAI Admin
            </p>
            <h1 className="max-w-[10ch] text-5xl font-display font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Protected admin dashboard.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/60">
              Enter the admin password to view wallet totals and SPKR allocation
              stats saved from the allocation checker.
            </p>
          </div>

          <div className="glass-card rounded-[36px] border border-brand-red/20 p-8 sm:p-10">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-red/15">
                <LockKeyhole className="h-8 w-8 text-brand-red-glow" />
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                Password Gate
              </span>
            </div>

            <h2 className="mb-3 text-3xl font-display font-black tracking-tight">
              Access `/spadmin`
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-white/55">
              This page is only for authorized personnel and internal use.
            </p>

            {error ? (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-100">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
                <span>{error}</span>
              </div>
            ) : null}

            <form action="/spadmin/login" method="post" className="space-y-5">
              <label className="block">
                <span className="mb-3 block text-[11px] font-black uppercase tracking-[0.35em] text-white/45">
                  Admin Password
                </span>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base text-white outline-none transition-colors placeholder:text-white/20 focus:border-brand-red/40"
                  placeholder="Enter password"
                  required
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-2xl bg-brand-red px-5 py-4 text-sm font-black uppercase tracking-[0.28em] text-white transition-all hover:bg-brand-red-glow"
              >
                Unlock Dashboard
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default async function SpadminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const loginError = formatErrorMessage(params.error);
  const adminPasswordConfigured = isSpadminConfigured();
  const authenticated =
    adminPasswordConfigured && (await isSpadminAuthenticated());

  if (!authenticated) {
    return (
      <LoginCard
        error={
          adminPasswordConfigured
            ? loginError
            : 'SPADMIN_PASSWORD is missing in your .env.'
        }
      />
    );
  }

  let stats: AdminStats = emptyStats;
  let dataError: string | null = null;

  if (!isSupabaseConfigured()) {
    dataError = 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in your .env.';
  } else {
    try {
      stats = await getSpadminStats();
    } catch (error) {
      console.error('Unable to load spadmin stats:', error);
      dataError =
        error instanceof Error
          ? error.message
          : 'Unable to load admin stats right now.';
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-brand-red selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[-8%] top-[-12%] h-[35%] w-[35%] rounded-full bg-brand-red/10 blur-[120px]" />
        <div className="absolute bottom-[-12%] right-[-5%] h-[38%] w-[38%] rounded-full bg-brand-red/10 blur-[120px]" />
        <div className="absolute right-[12%] top-[18%] h-[16%] w-[16%] rounded-full bg-brand-red/5 blur-[80px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.45em] text-brand-red-glow">
              SpeakerAI Admin
            </p>
            <h1 className="text-4xl font-display font-black tracking-tight sm:text-5xl">
              SPKR check totals
            </h1>
            <p className="mt-3 max-w-2xl text-white/55">
              Totals reflect the latest saved result for each unique wallet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/allocation"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/80 transition-all hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Allocation
            </Link>
            <form action="/spadmin/logout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-brand-red/25 bg-brand-red/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-red-glow transition-all hover:bg-brand-red/20"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        </div>

        {dataError ? (
          <div className="mb-8 flex items-start gap-3 rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-5 text-sm text-red-100">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
            <span>{dataError}</span>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass-card rounded-[32px] border border-brand-red/25 p-7">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/15">
              <Coins className="h-7 w-7 text-brand-red-glow" />
            </div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-white/40">
              Total Checked
            </p>
            <p className="text-4xl font-display font-black tracking-tight">
              {numberFormatter.format(stats.totalSpkrChecked)}
            </p>
            <p className="mt-2 text-sm text-white/50">Total SPKR checked</p>
          </div>

          <div className="glass-card rounded-[32px] border border-white/10 p-7">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <Wallet className="h-7 w-7 text-white/80" />
            </div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-white/40">
              Wallets Checked
            </p>
            <p className="text-4xl font-display font-black tracking-tight">
              {numberFormatter.format(stats.totalWallets)}
            </p>
            <p className="mt-2 text-sm text-white/50">Unique wallets checked</p>
          </div>

          <div className="glass-card rounded-[32px] border border-white/10 p-7">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <ShieldCheck className="h-7 w-7 text-white/80" />
            </div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-white/40">
              Eligible Wallets
            </p>
            <p className="text-4xl font-display font-black tracking-tight">
              {numberFormatter.format(stats.eligibleWallets)}
            </p>
            <p className="mt-2 text-sm text-white/50">Wallets meeting the snapshot threshold</p>
          </div>

          <div className="glass-card rounded-[32px] border border-white/10 p-7">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <Database className="h-7 w-7 text-white/80" />
            </div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-white/40">
              Last Checked
            </p>
            <p className="text-2xl font-display font-black tracking-tight">
              {formatTimestamp(stats.lastCheckedAt)}
            </p>
            <p className="mt-2 text-sm text-white/50">Most recent wallet check saved to Supabase</p>
          </div>
        </div>
      </main>
    </div>
  );
}
