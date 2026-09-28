import Link from 'next/link';
import { notFound } from 'next/navigation';

import { previews } from '@dailyx/ui/previews';

export default function GalleryPage() {
  if (process.env.APP_ENV === 'production') notFound();
  return (
    <main className="p-4">
      <ul className="flex flex-col gap-2">
        {Object.keys(previews).map((slug) => (
          <li key={slug}>
            <Link className="text-ink underline" href={`/dev/ui/${slug}`}>
              {slug}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
