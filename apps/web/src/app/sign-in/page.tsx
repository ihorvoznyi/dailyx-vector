import { Badge, Button, Card } from '@dailyx/ui';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { signInWithGoogle } from '@/server/auth-actions';
import { getAuth, googleConfigured } from '@/server/auth';
import { isAllowedEmail } from '@/server/auth-options';
import { env } from '@/server/env';

export const metadata: Metadata = { title: 'Sign in · Vector' };

interface SignInPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const rawError = params.error;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  const session = await getAuth().api.getSession({ headers: await headers() });
  if (session && isAllowedEmail(session.user.email, env.ALLOWED_EMAIL)) redirect('/settings');

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-000 px-5">
      <Card
        eyebrow="Vector"
        title="Sign in"
        meta="Only the owner's Google account can open Vector."
        className="w-full max-w-364px"
      >
        <div className="flex flex-col gap-4">
          {error ? <Badge tone="down">That Google account can&apos;t sign in here.</Badge> : null}
          <form action={signInWithGoogle}>
            <Button type="submit" variant="primary" disabled={!googleConfigured}>
              Continue with Google
            </Button>
          </form>
          {!googleConfigured ? (
            <p className="text-caption text-ink-faint">
              Google sign-in isn&apos;t configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in
              apps/web/.env.local.
            </p>
          ) : null}
        </div>
      </Card>
    </main>
  );
}
