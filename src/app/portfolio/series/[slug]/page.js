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

        {/* Back button — fixed under navbar */}
        <div className="mx-auto max-w-6xl px-4 pt-24 sm:px-6 sm:pt-28">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#2d7d6b] transition hover:text-[#1f4d43]"
          >
            <span aria-hidden="true">←</span> Back to Portfolio
          </Link>
        </div>

        <div className="mx-auto max-w-2xl px-4 pb-10 pt-8 text-center sm:px-6 sm:pb-16">
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

        {/* Bottom back link */}
        <div className="mx-auto max-w-6xl px-4 pb-20 text-center sm:px-6">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#2d7d6b] transition hover:text-[#1f4d43] border-b border-current pb-1"
          >
            <span aria-hidden="true">←</span> Back to Portfolio
          </Link>
        </div>
      </main>
    </>
  );
}
