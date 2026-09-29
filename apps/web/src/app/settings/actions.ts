'use server';

import { forUser } from '@dailyx/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireUser } from '@/server/auth';
import { getDb } from '@/server/db';

import { parseSettingsForm } from './parse';

export async function saveSettings(formData: FormData): Promise<never> {
  const user = await requireUser();
  const parsed = parseSettingsForm(formData);
  if (!parsed.ok) redirect(`/settings?error=${encodeURIComponent(parsed.error)}`);
  await forUser(getDb(), user.id).settings.update(parsed.data);
  revalidatePath('/settings');
  redirect('/settings?saved=1');
}
