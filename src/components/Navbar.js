'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { siteConfig } from '@/data/config';
import { useCart } from '@/components/CartProvider';
import { SHOP_CATEGORIES, shopHref } from '@/data/shopCategories';

// The Shop menu starts from the fixed categories; how many pieces each has arrives from the server.
const STATIC_SHOP_MENU = SHOP_CATEGORIES.map(category => ({
  slug: category.slug, title: category.title, href: shopHref(category),
  children: category.children?.map(child => ({ slug: child.slug, title: child.title, href: shopHref(category, child) })),
}));

const links = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Paintings', href: '/paintings' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Commissions', href: '/commissions' },
  { label: 'Shows', href: '/shows' },
  { label: 'About', href: '/about', children: [{ label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }] },
];

// the top tab a page belongs to (Contact belongs to About)
const topHrefFor = path => links.find(({ href, children }) => [href, ...(children || []).map(c => c.href)]
  .some(h => (h === '/' ? path === '/' : path.startsWith(h))))?.href || '/';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pendingHref, setPendingHref] = useState(null);
  const [flowing, setFlowing] = useState(false);
  const [flowReady, setFlowReady] = useState(false);
  const [shopMenu, setShopMenu] = useState(STATIC_SHOP_MENU);
  const [openSubmenu, setOpenSubmenu] = useState(null); // a category whose types are showing (Bookmarks)
  const [openMenu, setOpenMenu] = useState(null); // desktop: 'shop' or 'about'
  const [mobileOpenMenu, setMobileOpenMenu] = useState(null); // phone menu: 'shop' or 'about'
  const pathname = usePathname();
  const router = useRouter();
  const { count: cartCount, open: cartOpen, setOpen: setCartOpen } = useCart();
  const desktopNavRef = useRef(null);
  const mobileNavRef = useRef(null);
  const flowTimer = useRef(null);
  const overlayHero = pathname === '/' && !scrolled && !open;
  const currentHref = topHrefFor(pendingHref || pathname);

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
      setOpenMenu(null);
      setMobileOpenMenu(null);
      setOpenSubmenu(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/shop-collections')
      .then(res => (res.ok ? res.json() : []))
      .then(data => { if (!cancelled && Array.isArray(data) && data.length) setShopMenu(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Close an open menu (Shop / About) on a click anywhere outside it, or on Escape.
  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = event => {
      if (!event.target.closest?.(`[data-nav-menu="${openMenu}"]`)) setOpenMenu(null);
    };
    const onKeyDown = event => { if (event.key === 'Escape') setOpenMenu(null); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

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
  }, [currentHref, open, mobileOpenMenu, openSubmenu, shopMenu]);

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

  // how many pieces a category has for sale, or "soon" while it has none
  const countLabel = item => (item.count === undefined ? null : item.count > 0
    ? <span className="text-[11px] font-semibold tracking-normal text-[#2d7d6b]">{item.count}</span>
    : <span className="rounded-full bg-[#4ea87c]/15 px-2 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-[#2d7d6b]">soon</span>);
  // the dropdown panel and its rows (Shop and About menus)
  const panelClass = 'rounded-2xl border border-[#2d7d6b]/20 bg-[#fffaf2] p-2 shadow-[0_20px_44px_rgba(31,77,67,.28)]';
  const rowClass = active => `flex w-full items-center justify-between gap-6 rounded-xl px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors hover:bg-[#4ea87c]/15 ${
    active ? 'bg-[#4ea87c]/15 text-[#173f36]' : 'text-[#1f4d43]'
  }`;
  const dropdownClass = isOpen => `absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 transition duration-200 ${
    isOpen ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1 opacity-0'
  }`;
  const chevron = turned => (
    <svg className={`h-2 w-2.5 shrink-0 transition-transform duration-300 ${turned ? 'rotate-180' : ''}`} viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 1l4 4 4-4" />
    </svg>
  );

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
              className={`nav-flow-link px-3 py-2 text-[11px] tracking-[0.2em] uppercase lg:px-4 lg:text-xs lg:tracking-[0.25em] ${currentHref === href ? 'nav-flow-link--active' : ''}`}
              style={{ color: currentHref === href || overlayHero ? '#fffaf2' : 'var(--color-ocean)' }}
            >
              {label}
            </Link>
          );
          const menuButton = (name, isOpen) => (
            <button
              type="button"
              onClick={() => setOpenMenu(value => (value === name ? null : name))}
              aria-haspopup="true"
              aria-expanded={isOpen}
              className={`nav-flow-link flex items-center gap-1.5 px-3 py-2 text-[11px] tracking-[0.2em] uppercase lg:px-4 lg:text-xs lg:tracking-[0.25em] ${currentHref === href ? 'nav-flow-link--active' : ''}`}
              style={{ color: currentHref === href || overlayHero ? '#fffaf2' : 'var(--color-ocean)' }}
            >
              {label}
              {chevron(isOpen)}
            </button>
          );

          // About opens a small menu: About and Contact.
          if (links.find(l => l.href === href)?.children) {
            const isOpen = openMenu === 'about';
            return (
              <div key={label} data-nav-menu="about" className="relative flex">
                {menuButton('about', isOpen)}
                <div className={dropdownClass(isOpen)}>
                  <div className={`min-w-44 ${panelClass}`}>
                    {links.find(l => l.href === href).children.map(child => (
                      <Link key={child.href} href={child.href} prefetch={true}
                        onClick={event => { setOpenMenu(null); changePage(event, child.href); }}
                        aria-current={pathname === child.href ? 'page' : undefined} className={rowClass(pathname === child.href)}>
                        <span className="whitespace-nowrap">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          if (href !== '/shop') return link;

          // Shop opens its category menu on click instead of navigating.
          const shopOpen = openMenu === 'shop';
          return (
            <div key={label} data-nav-menu="shop" className="relative flex">
              <button
                type="button"
                onClick={() => setOpenMenu(value => (value === 'shop' ? null : 'shop'))}
                aria-haspopup="true"
                aria-expanded={shopOpen}
                className={`nav-flow-link flex items-center gap-1.5 px-3 py-2 text-[11px] tracking-[0.2em] uppercase lg:px-4 lg:text-xs lg:tracking-[0.25em] ${currentHref === href ? 'nav-flow-link--active' : ''}`}
                style={{ color: currentHref === href || overlayHero ? '#fffaf2' : 'var(--color-ocean)' }}
              >
                {label}
                {chevron(shopOpen)}
              </button>
              <div className={dropdownClass(shopOpen)}>
                <div className={`min-w-64 ${panelClass}`}>
                  {[{ slug: 'all', title: 'Shop All', href: '/shop' }, ...shopMenu].map(item => {
                    if (!item.children) {
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setOpenMenu(null)}
                          aria-current={pathname === item.href ? 'page' : undefined} className={rowClass(pathname === item.href)}>
                          <span className="whitespace-nowrap">{item.title}</span>
                          {countLabel(item)}
                        </Link>
                      );
                    }
                    // a category with types (Bookmarks): opens in place to show them
                    const expanded = openSubmenu === item.slug;
                    return (
                      <div key={item.href}>
                        <button type="button" onClick={() => setOpenSubmenu(expanded ? null : item.slug)} aria-expanded={expanded}
                          className={rowClass(pathname.startsWith(item.href))}>
                          <span className="whitespace-nowrap">{item.title}</span>
                          <span className="flex items-center gap-2">{countLabel(item)}{chevron(expanded)}</span>
                        </button>
                        {expanded && (
                          <div className="mb-1 ml-3 border-l-2 border-[#4ea87c]/35 pl-2">
                            {[{ slug: 'all', title: `All ${item.title}`, href: item.href, count: item.count }, ...item.children].map(child => (
                              <Link key={child.href} href={child.href} onClick={() => setOpenMenu(null)}
                                aria-current={pathname === child.href ? 'page' : undefined}
                                className={`flex items-center justify-between gap-6 rounded-xl px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors hover:bg-[#4ea87c]/15 ${
                                  pathname === child.href ? 'bg-[#4ea87c]/15 text-[#173f36]' : 'text-[#1f4d43]'
                                }`}>
                                <span className="whitespace-nowrap">{child.title}</span>
                                {countLabel(child)}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
          {links.map(({ label, href }) => {
            const linkClass = `nav-flow-link w-full py-3 text-center text-xs uppercase tracking-[0.25em] ${currentHref === href ? 'nav-flow-link--active' : ''}`;
            const linkStyle = { color: currentHref === href ? '#fffaf2' : 'var(--color-ocean)' };

            const mobileItemClass = (active, small = false) => `flex w-full items-center justify-center gap-2 py-2.5 text-center ${small ? 'text-[11px]' : 'text-[12px]'} font-medium uppercase tracking-[0.18em] ${
              active ? 'text-[#173f36] underline decoration-[#4ea87c] decoration-2 underline-offset-[6px]' : 'text-[#1f4d43]'
            }`;
            const mobileMenuButton = name => (
              <button
                type="button"
                onClick={() => setMobileOpenMenu(value => (value === name ? null : name))}
                aria-expanded={mobileOpenMenu === name}
                className={`${linkClass} flex items-center justify-center gap-2`}
                style={linkStyle}
              >
                {label}
                {chevron(mobileOpenMenu === name)}
              </button>
            );

            const aboutLink = links.find(l => l.href === href);
            if (aboutLink?.children) {
              return (
                <Fragment key={label}>
                  {mobileMenuButton('about')}
                  {mobileOpenMenu === 'about' && aboutLink.children.map(child => (
                    <Link key={child.href} href={child.href} prefetch={true} onClick={event => changePage(event, child.href)}
                      aria-current={pathname === child.href ? 'page' : undefined} className={mobileItemClass(pathname === child.href)}>
                      {child.label}
                    </Link>
                  ))}
                </Fragment>
              );
            }

            if (href !== '/shop') {
              return (
                <Link
                  key={label}
                  href={href}
                  prefetch={true}
                  onClick={(event) => changePage(event, href)}
                  aria-current={currentHref === href ? 'page' : undefined}
                  className={linkClass}
                  style={linkStyle}
                >
                  {label}
                </Link>
              );
            }

            const shopItems = [{ slug: 'all', title: 'Shop All', href: '/shop' }, ...shopMenu];
            return (
              <Fragment key={label}>
                {mobileMenuButton('shop')}
                {mobileOpenMenu === 'shop' && shopItems.map(item => {
                  if (!item.children) {
                    return (
                      <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined}
                        className={mobileItemClass(pathname === item.href)}>
                        {item.title}
                        {item.count === 0 && <span className="rounded-full bg-[#4ea87c]/15 px-2 py-0.5 text-[8px] font-semibold tracking-[0.12em] text-[#2d7d6b]">soon</span>}
                      </Link>
                    );
                  }
                  const expanded = openSubmenu === item.slug;
                  return (
                    <Fragment key={item.href}>
                      <button type="button" onClick={() => setOpenSubmenu(expanded ? null : item.slug)} aria-expanded={expanded}
                        className={mobileItemClass(pathname.startsWith(item.href))}>
                        {item.title}
                        {chevron(expanded)}
                      </button>
                      {expanded && [{ slug: 'all', title: `All ${item.title}`, href: item.href }, ...item.children].map(child => (
                        <Link key={child.href} href={child.href} aria-current={pathname === child.href ? 'page' : undefined}
                          className={mobileItemClass(pathname === child.href, true)}>
                          {child.title}
                        </Link>
                      ))}
                    </Fragment>
                  );
                })}
              </Fragment>
            );
          })}
        </nav>
      )}
    </header>
  );
}
