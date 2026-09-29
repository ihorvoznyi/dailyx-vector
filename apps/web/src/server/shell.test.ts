import { forUser, user } from '@dailyx/db';
import { createTestDb, seed } from '@dailyx/db/testing';
import { describe, expect, it } from 'vitest';

import { flaggedStages, isPresetId, PRESET_ORDER } from './channels';
import { loadShell } from './shell';

describe('channels', () => {
  it('orders presets the way the design system does', () => {
    expect(PRESET_ORDER).toEqual([
      'upwork',
      'email',
      'linkedin',
      'content',
      'referrals',
      'marketplace',
    ]);
  });

  it('flags cold email opens as unreliable', () => {
    expect(flaggedStages('email')).toEqual([1]);
    expect(flaggedStages('upwork')).toEqual([]);
  });

  it('validates a preset id', () => {
    expect(isPresetId('upwork')).toBe(true);
    expect(isPresetId('myspace')).toBe(false);
  });
});

describe('loadShell', () => {
  it('flags a fresh user as needing setup', async () => {
    const db = await createTestDb();
    await db.insert(user).values({ id: 'u1', name: 'U', email: 'u@x.com' });

    const shell = await loadShell(forUser(db, 'u1'));

    expect(shell.needsSetup).toBe(true);
    expect(shell.quickLogChannels).toEqual([]);
    expect(shell.timezone).toBe('UTC');
  });

  it('reads active channels for a seeded user', async () => {
    const db = await createTestDb();
    await seed(db, { email: 'owner@x.com', today: '2026-09-28', appEnv: undefined });

    const data = forUser(db, 'seed-owner');
    const shell = await loadShell(data);

    expect(shell.needsSetup).toBe(false);
    expect(shell.quickLogChannels.map((c) => c.preset)).toEqual([
      'upwork',
      'email',
      'linkedin',
      'referrals',
    ]);
    expect(shell.quickLogChannels.map((c) => c.name)).toEqual([
      'Upwork',
      'Cold email',
      'LinkedIn',
      'Referrals',
    ]);

    const linkedin = (await data.channelBets.list()).find((b) => b.preset === 'linkedin');
    if (!linkedin) throw new Error('expected a linkedin bet from the seed');
    await data.channelBets.update(linkedin.id, { hoursPerWeek: 0 });

    const paused = await loadShell(data);
    expect(paused.needsSetup).toBe(false);
    expect(paused.quickLogChannels.map((c) => c.preset)).not.toContain('linkedin');
  });
});
