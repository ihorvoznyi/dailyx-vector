'use server';

import type { TimedStage } from '@dailyx/core';
import { forUser } from '@dailyx/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { todayIn } from '../lib/dates';
import { parseLeadList } from '../lib/lead-list';
import { requireUser } from './auth';
import { getDb } from './db';
import { logMany, logOne, setAwaiting, toggleStage } from './outreach';

export type LogResult = { ok: true; count: number } | { ok: false; error: string };

const httpUrl = z
  .string()
  .trim()
  .regex(/^https?:\/\/\S+$/i, 'the link must start with http:// or https://');

const logOutreachInput = z.object({
  channelId: z.uuid(),
  contactName: z.string().trim().optional(),
  company: z.string().trim().optional(),
  url: z.union([httpUrl, z.literal('')]).optional(),
});

const logOutreachListInput = z.object({
  channelId: z.uuid(),
  text: z.string(),
});

const stageEnum = z.enum(['attention', 'conversation', 'meeting', 'win']);

async function today(userId: string): Promise<string> {
  const settings = await forUser(getDb(), userId).settings.get();
  return todayIn(settings.timezone);
}

export async function logOutreach(input: {
  channelId: string;
  contactName?: string;
  company?: string;
  url?: string;
}): Promise<LogResult> {
  const user = await requireUser();
  const parsed = logOutreachInput.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? 'Invalid outreach entry' };
  }
  const data = forUser(getDb(), user.id);
  const t = await today(user.id);
  await logOne(
    data,
    parsed.data.channelId,
    {
      contactName: parsed.data.contactName || null,
      company: parsed.data.company || null,
      url: parsed.data.url || null,
    },
    t,
  );
  revalidatePath('/', 'layout');
  return { ok: true, count: 1 };
}

export async function logOutreachList(input: {
  channelId: string;
  text: string;
}): Promise<LogResult> {
  const user = await requireUser();
  const parsed = logOutreachListInput.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? 'Invalid outreach list' };
  }
  const list = parseLeadList(parsed.data.text);
  if (!list.ok) return { ok: false, error: list.error };
  const data = forUser(getDb(), user.id);
  const t = await today(user.id);
  const count = await logMany(data, parsed.data.channelId, list.leads, t);
  revalidatePath('/', 'layout');
  return { ok: true, count };
}

/** Bindable form action: `<form action={tapStage.bind(null, id, stage)}>`. */
export async function tapStage(itemId: string, stage: TimedStage): Promise<void> {
  const user = await requireUser();
  const parsedId = z.uuid().parse(itemId);
  const parsedStage = stageEnum.parse(stage);
  const data = forUser(getDb(), user.id);
  const t = await today(user.id);
  await toggleStage(data, parsedId, parsedStage, t);
  revalidatePath('/', 'layout');
}

/** Bindable form action: `<form action={setAwaitingReply.bind(null, id, waiting)}>`. */
export async function setAwaitingReply(itemId: string, waiting: boolean): Promise<void> {
  const user = await requireUser();
  const parsedId = z.uuid().parse(itemId);
  const data = forUser(getDb(), user.id);
  await setAwaiting(data, parsedId, waiting, new Date());
  revalidatePath('/', 'layout');
}
