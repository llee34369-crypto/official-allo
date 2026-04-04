'use client';

import { useMemo, useState } from 'react';
import { Calculator, Coins, Database, Gauge, Settings2, Users, Wallet } from 'lucide-react';

const numberFormatter = new Intl.NumberFormat('en-US');
const decimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

interface SettingsState {
  airdropPool: number;
  minTxEligible: number;
  maxTxForCap: number;
  maxUserCap: number;
  transactionCount: number;
  userCount: number;
}

const defaultSettings: SettingsState = {
  airdropPool: 15000000,
  minTxEligible: 10,
  maxTxForCap: 10000,
  maxUserCap: 50000,
  transactionCount: 1000,
  userCount: 100,
};

function clampInteger(value: number, minimum = 0) {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.max(minimum, Math.floor(value));
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint: string;
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-[10px] font-black uppercase tracking-[0.35em] text-white/40">
        {label}
      </span>
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(event) => onChange(clampInteger(Number(event.target.value)))}
        className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-lg font-bold text-white outline-none transition-colors focus:border-brand-red/35"
      />
      <span className="mt-2 block text-xs text-white/35">{hint}</span>
    </label>
  );
}

export function SpadminExpectationCalculator() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  const calculated = useMemo(() => {
    const airdropPool = clampInteger(settings.airdropPool);
    const minTxEligible = clampInteger(settings.minTxEligible);
    const maxTxForCap = Math.max(clampInteger(settings.maxTxForCap), 1);
    const maxUserCap = clampInteger(settings.maxUserCap);
    const transactionCount = clampInteger(settings.transactionCount);
    const userCount = clampInteger(settings.userCount);

    const isEligible = transactionCount >= minTxEligible;
    const normalizedScore = Math.min(transactionCount / maxTxForCap, 1);
    const allocationPerUser = isEligible
      ? Math.floor(normalizedScore * maxUserCap)
      : 0;
    const totalTransactions = transactionCount * userCount;
    const totalSpkrForCohort = allocationPerUser * userCount;
    const poolUsagePercent =
      airdropPool > 0 ? (totalSpkrForCohort / airdropPool) * 100 : 0;
    const remainingPool = Math.max(airdropPool - totalSpkrForCohort, 0);
    const overflow = Math.max(totalSpkrForCohort - airdropPool, 0);
    const maxUsersAtThisTx =
      allocationPerUser > 0 ? Math.floor(airdropPool / allocationPerUser) : 0;
    const effectiveSpkrPerTx = maxUserCap / maxTxForCap;

    return {
      airdropPool,
      minTxEligible,
      maxTxForCap,
      maxUserCap,
      transactionCount,
      userCount,
      isEligible,
      allocationPerUser,
      totalTransactions,
      totalSpkrForCohort,
      poolUsagePercent,
      remainingPool,
      overflow,
      maxUsersAtThisTx,
      effectiveSpkrPerTx,
    };
  }, [settings]);

  const setValue = <K extends keyof SettingsState>(key: K, value: number) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <section className="mt-10 glass-card rounded-[40px] border border-brand-red/20 p-6 sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.45em] text-brand-red-glow">
            Expectation Calculator
          </p>
          <h2 className="text-3xl font-display font-black tracking-tight sm:text-4xl">
            What if you change the settings?
          </h2>
          <p className="mt-3 max-w-3xl text-white/55">
            This is a visual planning tool only. It does not change the live
            checker. Enter the settings you want, the transactions per user you
            expect, and how many users have that transaction count.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSettings(defaultSettings)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-white/75 transition-all hover:bg-white/10"
        >
          <Settings2 className="h-4 w-4" />
          Reset Defaults
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Airdrop Pool"
            value={settings.airdropPool}
            onChange={(value) => setValue('airdropPool', value)}
            hint="Total SPKR available for the airdrop."
          />
          <Field
            label="Min TX Eligible"
            value={settings.minTxEligible}
            onChange={(value) => setValue('minTxEligible', value)}
            hint="Users below this tx count get zero allocation."
          />
          <Field
            label="Max TX For Cap"
            value={settings.maxTxForCap}
            onChange={(value) => setValue('maxTxForCap', value)}
            hint="Users reach the max allocation at this tx count."
          />
          <Field
            label="Max User Cap"
            value={settings.maxUserCap}
            onChange={(value) => setValue('maxUserCap', value)}
            hint="Maximum SPKR any one user can receive."
          />
          <Field
            label="Transactions Per User"
            value={settings.transactionCount}
            onChange={(value) => setValue('transactionCount', value)}
            hint="The tx count each user in this scenario has."
          />
          <Field
            label="User Count"
            value={settings.userCount}
            onChange={(value) => setValue('userCount', value)}
            hint="How many users are in this same tx bucket."
          />
        </div>

        <div className="rounded-[32px] border border-brand-red/25 bg-[linear-gradient(165deg,rgba(139,0,0,0.14),rgba(10,10,10,0.96))] p-6 sm:p-7">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/15">
              <Calculator className="h-7 w-7 text-brand-red-glow" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">
                Scenario Output
              </p>
              <p className="text-xl font-display font-black">Live expectation view</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <div className="mb-3 flex items-center gap-3">
                <Wallet className="h-5 w-5 text-white/75" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                  Per User
                </span>
              </div>
              <p className="text-4xl font-display font-black">
                {numberFormatter.format(calculated.allocationPerUser)}
              </p>
              <p className="mt-2 text-sm text-white/50">
                SPKR for one user at {numberFormatter.format(calculated.transactionCount)} tx
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <div className="mb-3 flex items-center gap-3">
                <Users className="h-5 w-5 text-white/75" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                  Cohort Total
                </span>
              </div>
              <p className="text-4xl font-display font-black">
                {numberFormatter.format(calculated.totalSpkrForCohort)}
              </p>
              <p className="mt-2 text-sm text-white/50">
                SPKR needed for {numberFormatter.format(calculated.userCount)} users
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <div className="mb-3 flex items-center gap-3">
                <Database className="h-5 w-5 text-white/75" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                  Total TX
                </span>
              </div>
              <p className="text-4xl font-display font-black">
                {numberFormatter.format(calculated.totalTransactions)}
              </p>
              <p className="mt-2 text-sm text-white/50">Transactions across this full cohort</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <div className="mb-3 flex items-center gap-3">
                <Gauge className="h-5 w-5 text-white/75" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                  Pool Usage
                </span>
              </div>
              <p className="text-4xl font-display font-black">
                {decimalFormatter.format(calculated.poolUsagePercent)}%
              </p>
              <p className="mt-2 text-sm text-white/50">
                Of the {numberFormatter.format(calculated.airdropPool)} SPKR pool
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                Readout
              </p>
              <div className="mt-4 space-y-3 text-sm text-white/65">
                <p>
                  Eligibility:{' '}
                  <span className={calculated.isEligible ? 'text-green-400' : 'text-red-300'}>
                    {calculated.isEligible ? 'Eligible' : 'Not eligible'}
                  </span>
                </p>
                <p>
                  Effective SPKR per tx on the linear curve:{' '}
                  <span className="font-bold text-white">
                    {decimalFormatter.format(calculated.effectiveSpkrPerTx)}
                  </span>
                </p>
                <p>
                  Max users this pool can support at this tx count:{' '}
                  <span className="font-bold text-white">
                    {calculated.allocationPerUser > 0
                      ? numberFormatter.format(calculated.maxUsersAtThisTx)
                      : '0'}
                  </span>
                </p>
                <p>
                  Remaining pool after this cohort:{' '}
                  <span className="font-bold text-white">
                    {numberFormatter.format(calculated.remainingPool)} SPKR
                  </span>
                </p>
                <p>
                  Overflow above pool:{' '}
                  <span className="font-bold text-white">
                    {numberFormatter.format(calculated.overflow)} SPKR
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-brand-red/20 bg-brand-red/10 p-5">
              <div className="flex items-start gap-3">
                <Coins className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-glow" />
                <p className="text-sm leading-relaxed text-white/70">
                  Formula preview:{' '}
                  <span className="font-bold text-white">
                    allocation = eligible
                    ? floor(min(tx / maxTxForCap, 1) * maxUserCap)
                    : 0
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
