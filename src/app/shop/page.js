export const dynamic = 'force-dynamic';

import ArtworkGrid from '@/components/ArtworkGrid';
import { getShopArtworks } from '@/lib/layout';

export const metadata = {
  title: 'Shop | The Whimsical Mark',
};

export default async function ShopPage() {
  const artworks = await getShopArtworks();

  return (
    <main className="bg-white min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-28 text-center sm:px-6 sm:pb-16 sm:pt-36">
        <p className="mb-3 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--color-coral)' }}>Original Works</p>
        <h1 className="text-4xl font-light text-neutral-900 sm:text-5xl md:text-6xl" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Shop
        </h1>
        <div className="mx-auto mb-6 mt-6 h-px w-8 bg-neutral-300" />
        <p className="text-sm leading-relaxed text-neutral-500">
          Original paintings available to collect. Each piece is one of a kind.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
        <ArtworkGrid artworks={artworks} emptyMessage="New works coming soon" />
      </div>
    </main>
  );
}
