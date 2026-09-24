'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { cartCheckoutUrl, formatPrice } from '@/lib/checkout';

export default function CartDrawer() {
  const { items, open, setOpen, removeItem } = useCart();
  const pathname = usePathname();
  const subtotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  useEffect(() => { setOpen(false); }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = event => { if (event.key === 'Escape') setOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  return (
    <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-[#0f2d24]/40 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setOpen(false)}
      />

      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-[#fffaf2] shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-[#2d7d6b]/15 px-6 py-5">
          <h2 className="text-2xl font-light text-[#1f4d43]" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Your Cart {items.length > 0 && <span className="text-base text-neutral-400">({items.length})</span>}
          </h2>
          <button onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center text-2xl text-neutral-500 transition hover:text-neutral-900" aria-label="Close cart">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <p className="text-sm text-neutral-500">Your cart is empty.</p>
            <Link href="/shop" className="border-b border-[#2d7d6b] pb-0.5 text-xs uppercase tracking-[0.2em] text-[#2d7d6b]">
              Browse the Shop
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-[#2d7d6b]/10 overflow-y-auto px-6">
              {items.map(item => (
                <li key={item.variantId} className="flex gap-4 py-5">
                  <Link href={`/portfolio/${item.handle}`} className="h-20 w-20 shrink-0 bg-white p-1.5">
                    {item.image && <img src={item.image} alt={item.title} className="h-full w-full object-contain" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/portfolio/${item.handle}`} className="line-clamp-2 text-lg leading-tight text-[#1f4d43]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs tracking-wider text-neutral-500">{formatPrice(item.amount)}</p>
                    <button onClick={() => removeItem(item.variantId)} className="mt-auto self-start pt-2 text-[10px] uppercase tracking-[0.18em] text-neutral-400 transition hover:text-[#c0392b]">
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-[#2d7d6b]/15 px-6 py-6">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">Subtotal</span>
                <span className="text-lg text-[#1f4d43]">{formatPrice(subtotal)}</span>
              </div>
              <p className="mb-5 text-[11px] text-neutral-400">Shipping and taxes are calculated at checkout.</p>
              <a
                href={cartCheckoutUrl(items)}
                className="block bg-[#2d7d6b] px-6 py-4 text-center text-xs uppercase tracking-[0.22em] text-white transition hover:bg-[#1f4d43]"
              >
                Checkout
              </a>
              <button onClick={() => setOpen(false)} className="mt-3 w-full py-2 text-[11px] uppercase tracking-[0.18em] text-neutral-500 transition hover:text-neutral-900">
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
