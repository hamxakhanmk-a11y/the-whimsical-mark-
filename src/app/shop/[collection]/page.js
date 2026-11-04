export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import ArtworkGrid from '@/components/ArtworkGrid';
import ShopTabs from '@/components/ShopTabs';
import ShopCategoryView from '@/components/ShopCategoryView';
import { getShopCollections } from '@/lib/layout';
import { getShopCategory } from '@/lib/shopCategories';

export async function generateMetadata(props) {
  const { collection } = await props.params;
  const category = await getShopCategory(collection);
  if (category) return { title: `${category.category.title} | The Whimsical Mark` };
  const { all } = await getShopCollections();
  const current = all.find(c => c.handle === collection);
  return { title: `${current?.title || 'Shop'} | The Whimsical Mark` };
}

export default async function ShopCollectionPage(props) {
  const { collection } = await props.params;
  // a Shop category (e.g. /shop/bookmarks)
  const category = await getShopCategory(collection);
  if (category) return <ShopCategoryView {...category} />;
  // otherwise an old link to a Shopify collection still opens its page
  const { all } = await getShopCollections();
  const current = all.find(c => c.handle === collection);
  if (!current) notFound();

  return (
    <main className="bg-white min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-28 text-center sm:px-6 sm:pb-10 sm:pt-36">
        <p className="mb-3 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--color-coral)' }}>Shop</p>
        <h1 className="text-4xl font-light text-neutral-900 sm:text-5xl md:text-6xl" style={{ fontFamily: 'var(--font-cormorant)' }}>
          {current.title}
        </h1>
        <div className="mx-auto mb-6 mt-6 h-px w-8 bg-neutral-300" />
        <p className="text-sm leading-relaxed text-neutral-500">
          {current.artworks.length} {current.artworks.length === 1 ? 'piece' : 'pieces'} available
        </p>
      </div>

      <ShopTabs active={null} />

      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
        <ArtworkGrid artworks={current.artworks} emptyMessage="Nothing available in this collection right now" />
      </div>
    </main>
  );
}
