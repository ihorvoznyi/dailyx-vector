import { forUser } from '@dailyx/db';
import { createTestDb } from '@dailyx/db/testing';
import { betterAuth } from 'better-auth';
import { testUtils } from 'better-auth/plugins';
import { describe, expect, it } from 'vitest';

import { authOptions } from '../../server/auth-options';
import { fromHundredths, parseSettingsForm } from './parse';

const SECRET = 'x'.repeat(40);
const BASE_URL = 'http://localhost:3000';
const ALLOWED_EMAIL = 'owner@x.com';

interface UserWithSettings {
  id: string;
  taxRateBps: number;
  monthlyCost: number;
  timezone: string;
}

function validFormData(): FormData {
  const fd = new FormData();
  const base = {
    baseCurrency: 'USD',
    monthlyCost: '3800',
    monthlyCostCurrency: 'UAH',
    taxRate: '7.5',
    baselineRate: '65',
    targetHours: '40',
    horizonMonths: '18',
    timezone: 'Europe/Kyiv',
  };
  for (const [key, value] of Object.entries(base)) fd.append(key, value);
  return fd;
}

describe('Settings persist (stage 8)', () => {
  it('writes through forUser and reads back from the row and the session', async () => {
    const db = await createTestDb();
    const auth = betterAuth({
      ...authOptions({
        db,
        allowedEmail: ALLOWED_EMAIL,
        secret: SECRET,
        baseURL: BASE_URL,
        google: { clientId: 'id', clientSecret: 'secret' },
      }),
      plugins: [testUtils()],
    });
    const test = (await auth.$context).test;

    const created = (await test.saveUser(
      test.createUser({ email: ALLOWED_EMAIL }),
    )) as unknown as UserWithSettings | null;
    if (!created) throw new Error('expected the allowed user to be created');
    const { headers } = await test.login({ userId: created.id });

    const parsed = parseSettingsForm(validFormData());
    if (!parsed.ok) throw new Error(`expected a valid form: ${parsed.error}`);
    await forUser(db, created.id).settings.update(parsed.data);

    const settings = await forUser(db, created.id).settings.get();
    expect(settings).toEqual({
      baseCurrency: 'USD',
      monthlyCost: 380000,
      monthlyCostCurrency: 'UAH',
      taxRateBps: 750,
      baselineRate: 6500,
      targetHours: 40,
      horizonMonths: 18,
      timezone: 'Europe/Kyiv',
    });

    const session = await auth.api.getSession({ headers });
    const sessionUser = session?.user as unknown as UserWithSettings | undefined;
    expect(sessionUser?.taxRateBps).toBe(750);
    expect(sessionUser?.monthlyCost).toBe(380000);
    expect(sessionUser?.timezone).toBe('Europe/Kyiv');

    expect(fromHundredths(settings.monthlyCost)).toBe('3800.00');
  });
});
