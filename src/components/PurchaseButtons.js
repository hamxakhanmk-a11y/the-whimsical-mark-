'use client';

import { useCart } from '@/components/CartProvider';
import { cartCheckoutUrl, toCartItem } from '@/lib/checkout';

// size="card" for grid cards, size="large" for the artwork detail page
export default function PurchaseButtons({ artwork, size = 'card' }) {
  const { addItem, hasItem, setOpen } = useCart();
  const item = toCartItem(artwork);
  const inCart = hasItem(item.variantId);
  const buyNowUrl = cartCheckoutUrl([{ variantId: item.variantId, quantity: 1 }]);
  const sizeClass = size === 'large' ? 'glass-btn--lg' : '';

  return (
    <div className={size === 'large' ? 'contents' : 'mt-4 flex flex-wrap items-center justify-center gap-2'}>
      <button
        type="button"
        onClick={() => (inCart ? setOpen(true) : addItem(item))}
        className={`glass-btn glass-btn--outline ${sizeClass}`}
      >
        {inCart ? 'In Cart ✓' : 'Add to Cart'}
      </button>
      <a href={buyNowUrl} className={`glass-btn glass-btn--solid ${sizeClass}`}>
        Buy Now
      </a>
    </div>
  );
}
