'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getAuth } from './auth';

export async function signInWithGoogle(): Promise<never> {
  const { url } = await getAuth().api.signInSocial({
    body: { provider: 'google', callbackURL: '/settings', errorCallbackURL: '/sign-in' },
  });
  if (!url) throw new Error('Google sign-in returned no redirect URL');
  redirect(url);
}

export async function signOut(): Promise<never> {
  await getAuth().api.signOut({ headers: await headers() });
  redirect('/sign-in');
}
