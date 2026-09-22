import Link from 'next/link';
import BalancedArtworkImage from '@/components/BalancedArtworkImage';
import { isRoundArtwork } from '@/data/artworkPresentation';

export default function PortfolioGrid({ individuals = [], series = [], emptyMessage = 'Coming soon' }) {
  const total = individuals.length + series.length;
  if (total === 0) {
    return (
      <p className="text-center text-neutral-300 text-sm tracking-widest uppercase py-24">
        {emptyMessage}
      </p>
    );
  }

  // Interleave series and individuals; show series first
  const items = [
    ...series.map(s => ({ kind: 'series', payload: s })),
    ...individuals.map(a => ({ kind: 'artwork', payload: a })),
  ];

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
                  Series · {s.artworks.length} works
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
          <Link
            key={a.id}
            href={`/portfolio/${a.id}`}
            className="group flex h-full flex-col"
          >
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
              <h2 className="line-clamp-1 text-sm font-light leading-snug text-neutral-700">{a.title}</h2>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
