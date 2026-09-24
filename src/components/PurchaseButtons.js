'use client';

import { useCart } from '@/components/CartProvider';
import { cartCheckoutUrl, toCartItem } from '@/lib/checkout';

// size="card" for grid cards, size="large" for the artwork detail page
export default function PurchaseButtons({ artwork, size = 'card' }) {
  const { addItem, hasItem, setOpen } = useCart();
  const item = toCartItem(artwork);
  const inCart = hasItem(item.variantId);
  const buyNowUrl = cartCheckoutUrl([{ variantId: item.variantId, quantity: 1 }]);

  const base = size === 'large'
    ? 'inline-flex justify-center px-7 py-4 text-[10px] uppercase tracking-[0.2em] transition'
    : 'flex-1 px-2 py-2.5 text-center text-[10px] uppercase tracking-[0.16em] transition';

  return (
    <div className={size === 'large' ? 'contents' : 'mt-3 flex w-full gap-2'}>
      <button
        type="button"
        onClick={() => (inCart ? setOpen(true) : addItem(item))}
        className={`${base} border border-[#2d7d6b] text-[#2d7d6b] hover:bg-[#2d7d6b] hover:text-white`}
      >
        {inCart ? 'In Cart ✓' : 'Add to Cart'}
      </button>
      <a href={buyNowUrl} className={`${base} bg-[#2d7d6b] text-white hover:bg-[#c19875]`}>
        Buy Now
      </a>
    </div>
  );
}
