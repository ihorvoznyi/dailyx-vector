import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { authOptions, isAllowedEmail } from './auth-options';
import { getDb } from './db';
import { env } from './env';

function build() {
  return betterAuth({
    ...authOptions({
      db: getDb(),
      allowedEmail: env.ALLOWED_EMAIL,
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
      google:
        env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
          ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
          : undefined,
    }),
    plugins: [nextCookies()], // must be last; lets server actions set cookies
  });
}

const cache = globalThis as { vectorAuth?: ReturnType<typeof build> };

export function getAuth() {
  cache.vectorAuth ??= build();
  return cache.vectorAuth;
}

export const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

/** Server-only page gate. Redirects to /sign-in unless the owner is signed in. */
export async function requireUser() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session || !isAllowedEmail(session.user.email, env.ALLOWED_EMAIL)) redirect('/sign-in');
  return session.user;
}
