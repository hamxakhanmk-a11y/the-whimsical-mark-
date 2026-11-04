import Link from 'next/link';
import { shopHref } from '@/data/shopCategories';
import { getShopTree } from '@/lib/shopCategories';

// The Shop's category tabs ("Shop All" and each category); on a category with sub-categories (Bookmarks)
// a second row shows them.
export default async function ShopTabs({ active = 'all', activeSub = null }) {
  const categories = await getShopTree();
  const tabs = [{ slug: 'all', title: 'Shop All', href: '/shop' }, ...categories.map(c => ({ slug: c.slug, title: c.title, href: shopHref(c) }))];
  const current = categories.find(c => c.slug === active);
  const subTabs = current?.children
    ? [
        { slug: null, title: `All ${current.title}`, href: shopHref(current) },
        ...current.children.map(child => ({ slug: child.slug, title: child.short || child.title, href: shopHref(current, child) })),
      ]
    : null;

  return (
    <nav aria-label="Shop categories" className="mx-auto mb-10 max-w-6xl px-4 sm:mb-14 sm:px-6">
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {tabs.map(tab => {
          const isActive = tab.slug === active;
          return (
            <Link
              key={tab.slug}
              href={tab.href}
              aria-current={isActive && !activeSub ? 'page' : undefined}
              className={`glass-btn shrink-0 ${isActive ? 'glass-btn--solid' : 'glass-btn--outline'}`}
            >
              {tab.title}
            </Link>
          );
        })}
      </div>
      {subTabs && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          {subTabs.map(tab => {
            const isActive = tab.slug === activeSub;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                  isActive ? 'border-[#2d7d6b] bg-[#2d7d6b] text-[#fffaf2]' : 'border-[#2d7d6b]/25 text-[#2d7d6b] hover:bg-[#4ea87c]/10'
                }`}
              >
                {tab.title}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
