'use client';

import { cn } from '@dailyx/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/money', label: 'Money' },
  { href: '/acquisition', label: 'Acquisition' },
  { href: '/review', label: 'Review' },
  { href: '/settings', label: 'Settings' },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar flex w-full items-center gap-1 overflow-x-auto">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-8px px-3 py-2 text-14px leading-20px font-medium transition-colors duration-fast ease-out',
              active ? 'bg-bg-200 text-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
