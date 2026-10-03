import Link from 'next/link';

export default function ShopTabs({ collections = [], active = 'all' }) {
  if (collections.length === 0) return null;
  const tabs = [{ handle: 'all', title: 'Shop All', href: '/shop' }, ...collections.map(c => ({ ...c, href: `/shop/${c.handle}` }))];

  return (
    <nav aria-label="Shop collections" className="mx-auto mb-10 max-w-6xl px-4 sm:mb-14 sm:px-6">
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {tabs.map(tab => {
          const isActive = tab.handle === active;
          return (
            <Link
              key={tab.handle}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`glass-btn shrink-0 ${isActive ? 'glass-btn--solid' : 'glass-btn--outline'}`}
            >
              {tab.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
