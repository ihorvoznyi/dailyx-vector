import { forUser } from '@dailyx/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { MathProvider } from '@/components/math/math-provider';
import { QuickLog } from '@/components/quick-log/quick-log';
import { NavLinks } from '@/components/shell/nav-links';
import { requireUser } from '@/server/auth';
import { getDb } from '@/server/db';
import { loadShell } from '@/server/shell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const shell = await loadShell(forUser(getDb(), user.id));
  if (shell.needsSetup) redirect('/setup');
  return (
    <MathProvider timezone={shell.timezone}>
      <header className="border-b border-line bg-bg-100">
        <div className="mx-auto flex w-full max-w-1240px flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <Link href="/" className="order-1 font-semibold text-ink">
            Vector
          </Link>
          <div className="order-3 w-full min-w-0 sm:order-2 sm:w-auto sm:flex-1">
            <NavLinks />
          </div>
          <div className="order-2 ml-auto sm:order-3">
            <QuickLog channels={shell.quickLogChannels} />
          </div>
        </div>
      </header>
      {children}
    </MathProvider>
  );
}
