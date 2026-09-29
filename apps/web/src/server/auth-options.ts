import { account, session, user, verification, type Db } from '@dailyx/db';
import type { BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const SESSION_DAYS = 30;

/** The one allowlist rule: exact match after trim + lowercase; unset allows nobody. */
export function isAllowedEmail(email: string, allowed: string | undefined): boolean {
  return !!allowed && email.trim().toLowerCase() === allowed.trim().toLowerCase();
}

export interface AuthDeps {
  db: Db;
  allowedEmail: string | undefined;
  secret?: string | undefined;
  baseURL?: string | undefined;
  google?: { clientId: string; clientSecret: string } | undefined;
}

export function authOptions({ db, allowedEmail, secret, baseURL, google }: AuthDeps) {
  return {
    secret,
    baseURL,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user, session, account, verification },
    }),
    socialProviders: google ? { google: { ...google, prompt: 'select_account' as const } } : {},
    session: { expiresIn: 60 * 60 * 24 * SESSION_DAYS, updateAge: 60 * 60 * 24 },
    user: {
      additionalFields: {
        baseCurrency: { type: 'string', required: false, defaultValue: 'USD', input: false },
        monthlyCost: { type: 'number', required: false, defaultValue: 0, input: false },
        monthlyCostCurrency: { type: 'string', required: false, defaultValue: 'USD', input: false },
        taxRateBps: { type: 'number', required: false, defaultValue: 500, input: false },
        baselineRate: { type: 'number', required: false, defaultValue: 0, input: false },
        targetHours: { type: 'number', required: false, defaultValue: 0, input: false },
        horizonMonths: { type: 'number', required: false, defaultValue: 12, input: false },
        timezone: { type: 'string', required: false, defaultValue: 'UTC', input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          // false = no user row; Better Auth sends the OAuth callback to errorCallbackURL?error=...
          before: (u) =>
            Promise.resolve(isAllowedEmail(u.email, allowedEmail) ? { data: u } : false),
        },
      },
      session: {
        create: {
          before: async (s) => {
            const owner = await db.query.user.findFirst({
              where: (t, { eq }) => eq(t.id, s.userId),
              columns: { email: true },
            });
            return owner && isAllowedEmail(owner.email, allowedEmail) ? { data: s } : false;
          },
        },
      },
    },
  } satisfies BetterAuthOptions;
}
