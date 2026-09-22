export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArtworkGrid from '@/components/ArtworkGrid';
import { getSeriesBySlug } from '@/lib/shopify';

export default async function SeriesPage(props) {
  const { slug } = await props.params;
  const series = await getSeriesBySlug(slug);
  if (!series) notFound();

  return (
    <>
      <main className="bg-white min-h-screen">
        <div className="mx-auto max-w-2xl px-4 pb-10 pt-28 text-center sm:px-6 sm:pb-16 sm:pt-36">
          <nav className="mb-6 flex items-center justify-center gap-2 text-[10px] tracking-[0.25em] uppercase text-neutral-400">
            <Link href="/portfolio" className="transition hover:text-neutral-700">Portfolio</Link>
            <span>/</span>
            <span className="text-neutral-600">{series.name}</span>
          </nav>
          <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: 'var(--color-coral)' }}>Series</p>
          <h1 className="text-4xl font-light text-neutral-900 sm:text-5xl md:text-6xl" style={{ fontFamily: 'var(--font-cormorant)' }}>
            {series.name}
          </h1>
          <div className="w-8 h-px bg-neutral-300 mx-auto mt-6 mb-6" />
          <p className="text-sm text-neutral-500">{series.artworks.length} work{series.artworks.length !== 1 ? 's' : ''} in this series</p>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          <ArtworkGrid artworks={series.artworks} emptyMessage="No works yet" />
        </div>
      </main>
    </>
  );
}
