import Link from 'next/link';
import ArtworkGrid from '@/components/ArtworkGrid';
import ShopTabs from '@/components/ShopTabs';

// A Shop category (or sub-category) page; a category with nothing for sale yet shows "Coming soon".
export default function ShopCategoryView({ category, child, artworks }) {
  const title = child?.title || category.title;
  const count = artworks.length;

  return (
    <main className="bg-white min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-28 text-center sm:px-6 sm:pb-10 sm:pt-36">
        <p className="mb-3 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--color-coral)' }}>
          {child ? `Shop · ${category.title}` : 'Shop'}
        </p>
        <h1 className="text-4xl font-light text-neutral-900 sm:text-5xl md:text-6xl" style={{ fontFamily: 'var(--font-cormorant)' }}>
          {title}
        </h1>
        <div className="mx-auto mb-6 mt-6 h-px w-8 bg-neutral-300" />
        {count > 0 && (
          <p className="text-sm leading-relaxed text-neutral-500">{count} {count === 1 ? 'piece' : 'pieces'} available</p>
        )}
      </div>

      <ShopTabs active={category.slug} activeSub={child?.slug || null} />

      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
        {count > 0 ? (
          <ArtworkGrid artworks={artworks} />
        ) : (
          <div className="mx-auto max-w-md rounded-3xl border border-[#2d7d6b]/15 bg-[#fffaf2] px-8 py-14 text-center shadow-[0_18px_40px_rgba(31,77,67,.08)]">
            <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#4ea87c]">Coming soon</p>
            <p className="text-3xl font-light text-neutral-800" style={{ fontFamily: 'var(--font-cormorant)' }}>
              New {title.toLowerCase()} are on the way
            </p>
            <p className="mt-4 text-sm leading-relaxed text-neutral-500">
              Each piece is being made by hand. Check back soon, or explore what is in the shop now.
            </p>
            <Link href="/shop" className="glass-btn glass-btn--solid mt-8 inline-flex">Shop All</Link>
          </div>
        )}
      </div>
    </main>
  );
}
