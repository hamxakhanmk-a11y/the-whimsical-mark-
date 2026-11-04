import { getPortfolioAndSeries, getCommissionArtworks, getCollectionsWithArtworks } from '@/lib/shopify';
import { isPurchasable } from '@/lib/checkout';
import { getSavedLayout, sortByLayout } from '@/lib/savedLayout';
import { getPaintings } from '@/lib/shopCategories';

export { getSavedLayout, sortByLayout };

// The Portfolio page: everything except the paintings (they have their own Paintings page) and commissions.
export async function getPortfolioItems() {
  const [{ individuals, series }, paintings, keys] = await Promise.all([
    getPortfolioAndSeries(),
    getPaintings(),
    getSavedLayout('portfolio'),
  ]);
  const isPainting = new Set(paintings.map(a => a.handle));
  const items = [
    ...series
      .map(s => ({ ...s, artworks: s.artworks.filter(a => !isPainting.has(a.handle)) }))
      .filter(s => s.artworks.length > 0)
      .map(s => ({ key: `series:${s.slug}`, kind: 'series', payload: { ...s, cover_image: s.artworks[0].image_url || s.cover_image } })),
    ...individuals
      .filter(a => !isPainting.has(a.handle))
      .map(a => ({ key: `artwork:${a.handle}`, kind: 'artwork', payload: a })),
  ];
  return sortByLayout(items, keys);
}

// Shop All: everything that can be bought: the paintings first (in their CMS order), then the rest
// in the Portfolio order (a series expands in place into its pieces).
export async function getShopArtworks() {
  const [paintings, portfolio] = await Promise.all([getPaintings(), getPortfolioItems()]);
  const items = [...paintings.map(a => ({ kind: 'artwork', payload: a })), ...portfolio];
  const seen = new Set();
  const artworks = [];
  for (const item of items) {
    const list = item.kind === 'series' ? item.payload.artworks : [item.payload];
    for (const artwork of list) {
      if (!artwork || seen.has(artwork.handle)) continue;
      seen.add(artwork.handle);
      if (isPurchasable(artwork)) artworks.push(artwork);
    }
  }
  return artworks;
}

// Shop sub-tabs: each collection reduced to the paintings that can be bought.
// `all` keeps empty collections so an old link still opens a page instead of a 404.
export async function getShopCollections() {
  const collections = await getCollectionsWithArtworks();
  const all = collections.map(c => ({ ...c, artworks: c.artworks.filter(isPurchasable) }));
  return { all, tabs: all.filter(c => c.artworks.length > 0) };
}

export async function getCommissionItems() {
  const [artworks, keys] = await Promise.all([
    getCommissionArtworks(),
    getSavedLayout('commissions'),
  ]);
  const items = artworks.map(a => ({ key: `artwork:${a.handle}`, kind: 'artwork', payload: a }));
  return sortByLayout(items, keys);
}
