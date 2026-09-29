import { session as sessionTable, user as userTable } from '@dailyx/db';
import { createTestDb } from '@dailyx/db/testing';
import { betterAuth } from 'better-auth';
import { testUtils } from 'better-auth/plugins';
import { beforeEach, describe, expect, it } from 'vitest';

import { authOptions, isAllowedEmail, SESSION_DAYS } from './auth-options';

const SECRET = 'x'.repeat(40);
const BASE_URL = 'http://localhost:3000';
const GOOGLE = { clientId: 'id', clientSecret: 'secret' };

/** better-auth's testUtils types `createUser`/`saveUser` as the base `User`, without the
 * `additionalFields` declared in `authOptions`. They exist at runtime (trial-verified). */
interface UserWithSettings {
  id: string;
  taxRateBps: number;
  horizonMonths: number;
}

async function buildAuth(allowedEmail: string | undefined) {
  const db = await createTestDb();
  const auth = betterAuth({
    ...authOptions({ db, allowedEmail, secret: SECRET, baseURL: BASE_URL, google: GOOGLE }),
    plugins: [testUtils()],
  });
  const test = (await auth.$context).test;
  return { db, auth, test };
}

describe('isAllowedEmail', () => {
  it('matches after trim + lowercase', () => {
    expect(isAllowedEmail('Owner@X.com', 'owner@x.com')).toBe(true);
    expect(isAllowedEmail(' owner@x.com ', 'owner@x.com')).toBe(true);
  });

  it('rejects any other email, and an unset or empty allowlist', () => {
    expect(isAllowedEmail('evil@x.com', 'owner@x.com')).toBe(false);
    expect(isAllowedEmail('owner@x.com', undefined)).toBe(false);
    expect(isAllowedEmail('owner@x.com', '')).toBe(false);
  });
});

describe('authOptions on PGlite', () => {
  let ctx: Awaited<ReturnType<typeof buildAuth>>;

  beforeEach(async () => {
    ctx = await buildAuth('owner@x.com');
  });

  it('lets the allowed account sign in with a 30-day session', async () => {
    const { db, test } = ctx;
    const created = (await test.saveUser(
      test.createUser({ email: 'owner@x.com' }),
    )) as unknown as UserWithSettings | null;
    expect(created?.taxRateBps).toBe(500);
    expect(created?.horizonMonths).toBe(12);
    if (!created) throw new Error('expected the allowed user to be created');

    const { headers } = await test.login({ userId: created.id });
    const result = await ctx.auth.api.getSession({ headers });
    expect(result?.user.email).toBe('owner@x.com');
    const remainingMs = (result?.session.expiresAt.getTime() ?? 0) - Date.now();
    expect(Math.abs(remainingMs - SESSION_DAYS * 86_400_000)).toBeLessThan(60_000);

    void db;
  });

  it('rejects any other account at user-create time', async () => {
    const { db, test } = ctx;
    const created = await test.saveUser(test.createUser({ email: 'evil@x.com' }));
    expect(created).toBeNull();
    const rows = await db.select().from(userTable);
    expect(rows).toHaveLength(0);
  });

  it('rejects a session for a disallowed user at session-create time', async () => {
    const { db, test } = ctx;
    await db.insert(userTable).values({ id: 'evil', name: 'E', email: 'evil@x.com' });
    await expect(test.login({ userId: 'evil' })).rejects.toThrow();
    const rows = await db.select().from(sessionTable);
    expect(rows.filter((r) => r.userId === 'evil')).toHaveLength(0);
  });

  it('rejects everyone when the allowlist is unset', async () => {
    const other = await buildAuth(undefined);
    const created = await other.test.saveUser(other.test.createUser({ email: 'owner@x.com' }));
    expect(created).toBeNull();
  });

  it('builds a Google redirect without a network call', async () => {
    const result = await ctx.auth.api.signInSocial({
      body: { provider: 'google', callbackURL: '/settings', errorCallbackURL: '/sign-in' },
    });
    expect(result.url).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
    expect(result.url).toContain(
      'redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle',
    );
    expect(result.url).toContain('prompt=select_account');
  });

  it('signs out and clears the session', async () => {
    const { test } = ctx;
    const created = await test.saveUser(test.createUser({ email: 'owner@x.com' }));
    if (!created) throw new Error('expected the allowed user to be created');
    const { headers } = await test.login({ userId: created.id });

    const out = await ctx.auth.api.signOut({ headers });
    expect(out).toEqual({ success: true });
    const session = await ctx.auth.api.getSession({ headers });
    expect(session).toBeNull();
  });
});
