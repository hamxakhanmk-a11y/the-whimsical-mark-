import Link from 'next/link';
import BalancedArtworkImage from '@/components/BalancedArtworkImage';
import PurchaseButtons from '@/components/PurchaseButtons';
import { isRoundArtwork } from '@/data/artworkPresentation';
import { isPurchasable } from '@/lib/checkout';

export default function ArtworkGrid({ artworks, emptyMessage = 'Coming soon' }) {
  if (!artworks || artworks.length === 0) {
    return (
      <p className="text-center text-neutral-300 text-sm tracking-widest uppercase py-24">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16 lg:grid-cols-3 lg:gap-x-10">
      {artworks.map((artwork, index) => (
        <div key={artwork.id} className="flex h-full flex-col">
          <Link href={`/portfolio/${artwork.id}`} className="group flex flex-1 flex-col">
            <div className="relative mt-auto flex aspect-square w-full items-end justify-center transition-transform duration-500 group-hover:-translate-y-1">
              <BalancedArtworkImage
                src={artwork.image_url}
                alt={artwork.title}
                round={isRoundArtwork(artwork)}
                eager={index < 3}
              />
              {!artwork.available && (
                <div className="absolute top-3 left-3 bg-neutral-800/80 text-white text-[9px] tracking-[0.25em] uppercase px-3 py-1.5">
                  Sold
                </div>
              )}
            </div>

            <div className="mt-5 min-h-6 px-1 text-center">
              <h2 className="line-clamp-2 text-sm font-light leading-snug text-neutral-800" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.05rem' }}>{artwork.title}</h2>
              {artwork.price && (
                <p className="mt-1 text-[11px] text-neutral-400 tracking-wider">{artwork.price}</p>
              )}
            </div>
          </Link>
          {isPurchasable(artwork) && <PurchaseButtons artwork={artwork} />}
        </div>
      ))}
    </div>
  );
}
