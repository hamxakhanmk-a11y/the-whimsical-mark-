import Link from 'next/link';
import BalancedArtworkImage from '@/components/BalancedArtworkImage';
import PurchaseButtons from '@/components/PurchaseButtons';
import { isRoundArtwork } from '@/data/artworkPresentation';
import { isPurchasable } from '@/lib/checkout';

export default function PortfolioGrid({ items = [], emptyMessage = 'Coming soon' }) {
  if (items.length === 0) {
    return (
      <p className="text-center text-neutral-300 text-sm tracking-widest uppercase py-24">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16 lg:grid-cols-3 lg:gap-x-10">
      {items.map((item, index) => {
        if (item.kind === 'series') {
          const s = item.payload;
          return (
            <Link
              key={`series-${s.slug}`}
              href={`/portfolio/series/${s.slug}`}
              className="group flex h-full flex-col"
            >
              <div className="relative mt-auto flex aspect-square w-full items-end justify-center transition-transform duration-500 group-hover:-translate-y-1">
                <BalancedArtworkImage
                  src={s.cover_image}
                  alt={s.name}
                  eager={index < 3}
                />
                <div className="absolute top-3 left-3 bg-[#2d7d6b] text-white text-[9px] tracking-[0.25em] uppercase px-3 py-1.5">
                  {s.artworks.length} {s.artworks.length === 1 ? 'work' : 'works'}
                </div>
              </div>
              <div className="mt-5 min-h-6 px-1 text-center">
                <h2 className="line-clamp-1 text-sm font-light leading-snug text-neutral-700">{s.name}</h2>
              </div>
            </Link>
          );
        }
        const a = item.payload;
        return (
          <div key={a.id} className="flex h-full flex-col">
            <Link href={`/portfolio/${a.id}`} className="group flex flex-1 flex-col">
              <div className="relative mt-auto flex aspect-square w-full items-end justify-center transition-transform duration-500 group-hover:-translate-y-1">
                <BalancedArtworkImage
                  src={a.image_url}
                  alt={a.title}
                  round={isRoundArtwork(a)}
                  eager={index < 3}
                />
                {!a.available && (
                  <div className="absolute top-3 left-3 bg-neutral-800/80 text-white text-[9px] tracking-[0.25em] uppercase px-3 py-1.5">
                    Sold
                  </div>
                )}
              </div>
              <div className="mt-5 min-h-6 px-1 text-center">
                <h2 className="line-clamp-2 text-sm font-light leading-snug text-neutral-800" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.05rem' }}>{a.title}</h2>
                {a.price && <p className="mt-1 text-[11px] tracking-wider text-neutral-400">{a.price}</p>}
              </div>
            </Link>
            {isPurchasable(a) && <PurchaseButtons artwork={a} />}
          </div>
        );
      })}
    </div>
  );
}
