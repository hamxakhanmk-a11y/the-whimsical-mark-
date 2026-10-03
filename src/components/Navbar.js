'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { siteConfig } from '@/data/config';
import { useCart } from '@/components/CartProvider';

const links = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Commissions', href: '/commissions' },
  { label: 'Shows', href: '/shows' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pendingHref, setPendingHref] = useState(null);
  const [flowing, setFlowing] = useState(false);
  const [flowReady, setFlowReady] = useState(false);
  const [shopCollections, setShopCollections] = useState([]);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { count: cartCount, open: cartOpen, setOpen: setCartOpen } = useCart();
  const desktopNavRef = useRef(null);
  const mobileNavRef = useRef(null);
  const flowTimer = useRef(null);
  const overlayHero = pathname === '/' && !scrolled && !open;
  const currentHref = pendingHref || links.find(({ href }) => (
    href === '/' ? pathname === '/' : pathname.startsWith(href)
  ))?.href || '/';

  useEffect(() => {
    const onScroll = () => {
      if (pathname !== '/') {
        setScrolled(window.scrollY > 10);
        return;
      }

      const gallery = document.getElementById('gallery');
      const navHeight = 132;
      setScrolled(Boolean(gallery && gallery.getBoundingClientRect().top <= navHeight));
    };

    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPendingHref(null);
      setOpen(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/shop-collections')
      .then(res => (res.ok ? res.json() : []))
      .then(data => { if (!cancelled && Array.isArray(data)) setShopCollections(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { setShopMenuOpen(false); }, [pathname]);

  useEffect(() => {
    // Measured from on-screen centres (not offsetLeft) so links can sit inside wrappers like the
    // Shop dropdown, and the active link's scale() doesn't skew the width.
    const positionIndicator = (container, mobile = false) => {
      if (!container) return false;
      const active = container.querySelector('.nav-flow-link--active');
      if (!active || active.offsetParent === null) return false;
      const a = active.getBoundingClientRect();
      const c = container.getBoundingClientRect();

      if (mobile) {
        const centerY = a.top + a.height / 2 - c.top + container.scrollTop;
        container.style.setProperty('--nav-flow-y', `${centerY - active.offsetHeight / 2}px`);
        container.style.setProperty('--nav-flow-h', `${active.offsetHeight}px`);
      } else {
        const centerX = a.left + a.width / 2 - c.left;
        container.style.setProperty('--nav-flow-x', `${centerX - active.offsetWidth / 2}px`);
        container.style.setProperty('--nav-flow-w', `${active.offsetWidth}px`);
      }
      return true;
    };

    const syncIndicators = () => {
      const positioned = positionIndicator(desktopNavRef.current);
      const positionedMobile = positionIndicator(mobileNavRef.current, true);
      if (positioned || positionedMobile) setFlowReady(true);
    };

    const frame = window.requestAnimationFrame(syncIndicators);
    window.addEventListener('resize', syncIndicators);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', syncIndicators);
    };
  }, [currentHref, open]);

  useEffect(() => () => {
    window.clearTimeout(flowTimer.current);
  }, []);

  const changePage = (event, href) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    // Only block if we're already on the exact same URL (not just a sub-path)
    if (href === pathname && !pendingHref) return;

    window.clearTimeout(flowTimer.current);
    setPendingHref(href);
    setFlowing(false);

    window.requestAnimationFrame(() => {
      setFlowing(true);
      flowTimer.current = window.setTimeout(() => setFlowing(false), 1120);
    });

    router.push(href);
  };

  if (pathname.startsWith('/admin')) return null;

  return (
    <header
      className={`navbar-shell fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${
        overlayHero
          ? 'navbar-shell--hero text-white'
          : 'navbar-shell--solid text-[#2d7d6b]'
      } ${
        scrolled || !overlayHero ? 'shadow-sm' : ''
      }`}
    >
      {/* Top row — artist name */}
      <div data-hero-scroll-bypass className={`relative flex min-h-16 items-center justify-center border-b px-4 py-3 sm:px-6 ${
        overlayHero ? 'border-white/20' : 'border-neutral-100'
      }`}>
        {/* Cart — left corner */}
        <button
          onClick={() => setCartOpen(true)}
          aria-pressed={cartOpen}
          className={`emboss-toggle ${overlayHero ? 'emboss-toggle--dark' : ''} absolute left-4 sm:left-6`}
          aria-label={`Open cart${cartCount ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`}
        >
          {/* Boutique tote bag */}
          <svg className="h-[1.3rem] w-[1.3rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5.2 8.6h13.6l-1.05 10.2a2 2 0 0 1-2 1.8H8.25a2 2 0 0 1-2-1.8L5.2 8.6z" />
            <path d="M9 11V7.4a3 3 0 0 1 6 0V11" />
            <circle cx="9" cy="11" r=".55" fill="currentColor" stroke="none" />
            <circle cx="15" cy="11" r=".55" fill="currentColor" stroke="none" />
          </svg>
          {cartCount > 0 && (
            <span key={cartCount} className="emboss-badge">{cartCount}</span>
          )}
        </button>

        <Link
          href="/"
          prefetch={true}
          className="max-w-[calc(100%-6.5rem)] truncate text-[15px] uppercase tracking-[0.12em] max-[359px]:text-[13px] max-[359px]:tracking-[0.06em] transition-colors duration-300 min-[400px]:text-lg min-[400px]:tracking-[0.16em] sm:text-xl sm:tracking-[0.3em] md:text-2xl"
          style={{ fontFamily: 'var(--font-cormorant)', color: overlayHero ? '#fffaf2' : 'var(--color-ocean)' }}
        >
          {siteConfig.artistName}
        </Link>

        {/* Mobile hamburger */}
        <button
          className={`emboss-toggle ${overlayHero ? 'emboss-toggle--dark' : ''} absolute right-4 flex-col gap-[5px] sm:right-6 md:hidden`}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <span className="block h-px w-5 bg-current transition-all duration-300"
            style={{ transform: open ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
          <span className="block h-px w-5 bg-current transition-all duration-300"
            style={{ opacity: open ? 0 : 1 }} />
          <span className="block h-px w-5 bg-current transition-all duration-300"
            style={{ transform: open ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
        </button>
      </div>

      {/* Bottom row — nav links (desktop) */}
      <nav
        ref={desktopNavRef}
        className={`nav-flow-tabs hidden md:flex justify-center gap-1 py-1.5 px-4 lg:gap-4 lg:px-6 ${flowReady ? 'nav-flow-tabs--ready' : ''} ${flowing ? 'is-flowing' : ''}`}
      >
        <span className="nav-flow-indicator" aria-hidden="true" />
        {links.map(({ label, href }) => {
          const link = (
            <Link
              key={label}
              href={href}
              prefetch={true}
              onClick={(event) => changePage(event, href)}
              aria-current={currentHref === href ? 'page' : undefined}
              aria-haspopup={href === '/shop' && shopCollections.length > 0 ? 'true' : undefined}
              aria-expanded={href === '/shop' && shopCollections.length > 0 ? shopMenuOpen : undefined}
              className={`nav-flow-link px-3 py-2 text-[11px] tracking-[0.2em] uppercase lg:px-4 lg:text-xs lg:tracking-[0.25em] ${currentHref === href ? 'nav-flow-link--active' : ''}`}
              style={{ color: currentHref === href || overlayHero ? '#fffaf2' : 'var(--color-ocean)' }}
            >
              {label}
            </Link>
          );
          if (href !== '/shop' || shopCollections.length === 0) return link;

          return (
            <div
              key={label}
              className="relative flex"
              onMouseEnter={() => setShopMenuOpen(true)}
              onMouseLeave={() => setShopMenuOpen(false)}
              onFocus={() => setShopMenuOpen(true)}
              onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setShopMenuOpen(false); }}
              onKeyDown={event => { if (event.key === 'Escape') setShopMenuOpen(false); }}
            >
              {link}
              <div
                className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 transition duration-200 ${
                  shopMenuOpen ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1 opacity-0'
                }`}
              >
                <div className="min-w-56 rounded-2xl border border-[#2d7d6b]/15 bg-[#fffaf2]/95 p-2 shadow-[0_18px_40px_rgba(31,77,67,.18)] backdrop-blur-md">
                  {[{ handle: '', title: 'Shop All', href: '/shop' }, ...shopCollections.map(c => ({ ...c, href: `/shop/${c.handle}` }))].map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShopMenuOpen(false)}
                      aria-current={pathname === item.href ? 'page' : undefined}
                      className={`flex items-center justify-between gap-6 rounded-xl px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[#4ea87c]/12 ${
                        pathname === item.href ? 'bg-[#4ea87c]/12 text-[#1f4d43]' : 'text-[#2d7d6b]'
                      }`}
                    >
                      <span className="whitespace-nowrap">{item.title}</span>
                      {item.count ? <span className="text-[10px] tracking-normal text-neutral-400">{item.count}</span> : null}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <nav
          ref={mobileNavRef}
          className={`nav-flow-tabs nav-flow-tabs--mobile flex max-h-[calc(100svh-4rem)] flex-col items-center gap-1 overflow-y-auto border-t border-[#4ea87c]/15 bg-[#fffaf2] py-3 md:hidden ${flowReady ? 'nav-flow-tabs--ready' : ''} ${flowing ? 'is-flowing' : ''}`}
        >
          <span className="nav-flow-indicator" aria-hidden="true" />
          {links.map(({ label, href }) => (
            <Fragment key={label}>
              <Link
                href={href}
                prefetch={true}
                onClick={(event) => changePage(event, href)}
                aria-current={currentHref === href ? 'page' : undefined}
                className={`nav-flow-link w-full py-3 text-center text-xs uppercase tracking-[0.25em] ${currentHref === href ? 'nav-flow-link--active' : ''}`}
                style={{ color: currentHref === href ? '#fffaf2' : 'var(--color-ocean)' }}
              >
                {label}
              </Link>
              {href === '/shop' && shopCollections.map(collection => (
                <Link
                  key={collection.handle}
                  href={`/shop/${collection.handle}`}
                  aria-current={pathname === `/shop/${collection.handle}` ? 'page' : undefined}
                  className={`w-full py-2 text-center text-[10px] uppercase tracking-[0.22em] ${
                    pathname === `/shop/${collection.handle}` ? 'text-[#1f4d43] underline underline-offset-4' : 'text-[#2d7d6b]/70'
                  }`}
                >
                  {collection.title}
                </Link>
              ))}
            </Fragment>
          ))}
        </nav>
      )}
    </header>
  );
}
