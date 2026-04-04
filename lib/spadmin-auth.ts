import 'server-only';

import { createHash, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'spadmin-session';
const COOKIE_PATH = '/spadmin';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export function isSpadminConfigured() {
  return Boolean(process.env.SPADMIN_PASSWORD?.trim());
}

function hashPassword(value: string) {
  return createHash('sha256').update(`speakerai-spadmin:${value}`).digest('hex');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getExpectedSessionValue() {
  const password = process.env.SPADMIN_PASSWORD?.trim();

  if (!password) {
    return null;
  }

  return hashPassword(password);
}

export function verifySpadminPassword(password: string) {
  const configuredPassword = process.env.SPADMIN_PASSWORD?.trim();

  if (!configuredPassword) {
    return false;
  }

  return safeEqual(hashPassword(password), hashPassword(configuredPassword));
}

export async function isSpadminAuthenticated() {
  const expectedSessionValue = getExpectedSessionValue();

  if (!expectedSessionValue) {
    return false;
  }

  const cookieStore = await cookies();
  const currentSessionValue = cookieStore.get(COOKIE_NAME)?.value;

  return currentSessionValue
    ? safeEqual(currentSessionValue, expectedSessionValue)
    : false;
}

export async function createSpadminSession() {
  const sessionValue = getExpectedSessionValue();

  if (!sessionValue) {
    throw new Error('Missing SPADMIN_PASSWORD in the environment.');
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: COOKIE_PATH,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSpadminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: COOKIE_PATH,
    maxAge: 0,
  });
}
