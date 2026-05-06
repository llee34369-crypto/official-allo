'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

const COOKIE_CONSENT_STORAGE_KEY = 'speakerai:cookie-consent';

type CookieConsentChoice = 'accepted' | 'rejected';

function persistCookieConsent(choice: CookieConsentChoice) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify({
      choice,
      savedAt: Date.now(),
    })
  );
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)?.trim();

    if (!savedValue) {
      setIsVisible(true);
      return;
    }

    try {
      const parsedValue = JSON.parse(savedValue) as { choice?: CookieConsentChoice };

      if (parsedValue.choice !== 'accepted' && parsedValue.choice !== 'rejected') {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] px-3 pb-3 sm:px-4 sm:pb-4"
    >
      <div className="pointer-events-auto mx-auto max-w-5xl overflow-hidden rounded-[26px] border border-[#7a1c1c]/45 bg-[linear-gradient(180deg,rgba(30,8,8,0.96),rgba(12,4,4,0.98))] shadow-[0_-10px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_40%,rgba(255,90,90,0.07))]" />
        <div className="relative flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ffb0b0]">
              Cookie Preferences
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/72">
              We use cookies and similar technologies for website functionality, analytics, and
              service improvement. You can allow all cookies or reject non-essential cookies. Read
              the{' '}
              <Link
                href="/cookie-policy"
                className="font-bold text-[#ff9b9b] transition-colors hover:text-white"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                persistCookieConsent('rejected');
                setIsVisible(false);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white/80 transition-all hover:bg-white/[0.09] hover:text-white"
            >
              Reject All Cookies
            </button>
            <button
              type="button"
              onClick={() => {
                persistCookieConsent('accepted');
                setIsVisible(false);
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-brand-red px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-brand-red-glow"
            >
              Allow All Cookies
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
