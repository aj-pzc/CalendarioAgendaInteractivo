import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'userId';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET debe contener al menos 32 caracteres.');
  }
  return secret;
}

function signUserId(userId: string) {
  return createHmac('sha256', getSessionSecret()).update(userId).digest('base64url');
}

export async function getSessionUserId() {
  const value = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!value) return null;

  const separator = value.lastIndexOf('.');
  if (separator <= 0) return null;

  const userId = value.slice(0, separator);
  const providedSignature = Buffer.from(value.slice(separator + 1), 'base64url');
  const expectedSignature = Buffer.from(signUserId(userId), 'base64url');

  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return null;
  }

  return userId;
}

export async function setSessionCookie(userId: string) {
  const signature = signUserId(userId);
  (await cookies()).set(SESSION_COOKIE_NAME, `${userId}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}
