import { notFound } from 'next/navigation';

import { previews } from '@dailyx/ui/previews';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(previews).map((name) => ({ name }));
}

export default async function PreviewPage({ params }: PageProps<'/dev/ui/[name]'>) {
  if (process.env.APP_ENV === 'production') notFound();
  const Preview = previews[(await params).name];
  if (!Preview) notFound();
  return (
    <div id="root" className="p-4">
      <Preview />
    </div>
  );
}
