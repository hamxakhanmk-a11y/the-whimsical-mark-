import { cache } from 'react';
import { SHOP_CATEGORIES, normalizeShopCategories, shopHref } from '@/data/shopCategories';
import { getCollectionArtworksMatching } from '@/lib/shopify';
import { getSiteText, getSavedLayout, sortByLayout } from '@/lib/savedLayout';
import { isPurchasable } from '@/lib/checkout';

// The Shop's categories: the version saved in the CMS Shop tab, or the starting ones.
// (Read once per page view, however many parts of the page ask.)
export const getShopTree = cache(async () => {
  try {
    const saved = await getSiteText('shop_categories');
    const tree = saved ? normalizeShopCategories(JSON.parse(saved)) : null;
    if (tree) return tree;
  } catch {}
  return SHOP_CATEGORIES;
});

// Every painting in the Paintings collection, sold ones too, in the order set in the CMS Layout tab
// (Paintings section; until that's saved, the old Portfolio order).
export const getPaintings = cache(async () => {
  const paintingsCategory = (await getShopTree()).find(c => c.paintings);
  const [artworks, own, legacy] = await Promise.all([
    getCollectionArtworksMatching(paintingsCategory?.match || []),
    getSavedLayout('paintings'),
    getSavedLayout('portfolio'),
  ]);
  const items = artworks
    .filter(a => a.section !== 'commissions')
    .map(a => ({ key: `artwork:${a.handle}`, kind: 'artwork', payload: a }));
  return sortByLayout(items, own.length ? own : legacy).map(item => item.payload);
});

// All the products in a category (or one of its types), sold ones included.
async function artworksFor(node) {
  if (node.paintings) return getPaintings();
  if (node.children) {
    // everything in its types, plus anything put straight into the category's own collection
    const lists = await Promise.all([...node.children.map(artworksFor), getCollectionArtworksMatching(node.match || [])]);
    const seen = new Set();
    return lists.flat().filter(a => !seen.has(a.handle) && seen.add(a.handle));
  }
  return getCollectionArtworksMatching(node.match || []);
}

// A Shop category page: the category, the chosen type (if any) and what's for sale in it.
// Returns null for a slug that isn't a category.
export async function getShopCategory(slug, subSlug) {
  const category = (await getShopTree()).find(c => c.slug === slug);
  if (!category) return null;
  const child = subSlug ? category.children?.find(c => c.slug === subSlug) : null;
  if (subSlug && !child) return null;
  const artworks = (await artworksFor(child || category)).filter(isPurchasable);
  return { category, child, artworks };
}

// The Shop menu with how many pieces are for sale in each category and type.
export async function getShopMenu() {
  const tree = await getShopTree();
  return Promise.all(tree.map(async category => {
    const children = category.children
      ? await Promise.all(category.children.map(async child => ({
          slug: child.slug, title: child.title, href: shopHref(category, child),
          count: (await artworksFor(child)).filter(isPurchasable).length,
        })))
      : undefined;
    const count = (await artworksFor(category)).filter(isPurchasable).length;
    return { slug: category.slug, title: category.title, href: shopHref(category), count, children };
  }));
}
