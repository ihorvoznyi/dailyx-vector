'use server';

import { forUser } from '@dailyx/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { weekStartIn } from '@/lib/dates';
import { requireUser } from '@/server/auth';
import { getDb } from '@/server/db';
import { confirmWeekHours, finishWeek, loadReview, parseHoursForm } from '@/server/review';

export async function confirmHours(formData: FormData): Promise<never> {
  const authedUser = await requireUser();
  const data = forUser(getDb(), authedUser.id);

  const view = await loadReview(data);
  const parsed = parseHoursForm(
    formData,
    view.hours.map((h) => h.bet.id),
  );
  if (!parsed.ok) redirect(`/review?error=${encodeURIComponent(parsed.error)}`);

  await confirmWeekHours(data, view.weekStart, parsed.data);

  revalidatePath('/', 'layout');
  redirect('/review?saved=hours');
}

export async function finishReview(): Promise<never> {
  const authedUser = await requireUser();
  const data = forUser(getDb(), authedUser.id);

  const settings = await data.settings.get();
  const weekStart = weekStartIn(settings.timezone);
  await finishWeek(data, weekStart, new Date());

  revalidatePath('/', 'layout');
  redirect('/review?saved=done');
}
