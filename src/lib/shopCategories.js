import { SHOP_CATEGORIES, shopHref } from '@/data/shopCategories';
import { getCollectionArtworksMatching } from '@/lib/shopify';
import { getSavedLayout, sortByLayout } from '@/lib/layout';
import { isPurchasable } from '@/lib/checkout';

// Every painting in the Portfolio collection, sold ones too, in the order set in the CMS Layout tab.
export async function getPaintings() {
  const paintingsCategory = SHOP_CATEGORIES.find(c => c.paintings);
  const [artworks, keys] = await Promise.all([
    getCollectionArtworksMatching(paintingsCategory.match),
    getSavedLayout('portfolio'),
  ]);
  const items = artworks
    .filter(a => a.section !== 'commissions')
    .map(a => ({ key: `artwork:${a.handle}`, kind: 'artwork', payload: a }));
  return sortByLayout(items, keys).map(item => item.payload);
}

// All the products in a category (or one of its sub-categories), sold ones included.
async function artworksFor(node) {
  if (node.paintings) return getPaintings();
  if (node.children) {
    // everything in its types, plus anything put straight into the category's own collection
    const lists = await Promise.all([...node.children.map(artworksFor), getCollectionArtworksMatching(node.match || [])]);
    const seen = new Set();
    return lists.flat().filter(a => !seen.has(a.handle) && seen.add(a.handle));
  }
  return getCollectionArtworksMatching(node.match);
}

// A Shop category page: the category, the chosen sub-category (if any) and what's for sale in it.
// Returns null for a slug that isn't a category.
export async function getShopCategory(slug, subSlug) {
  const category = SHOP_CATEGORIES.find(c => c.slug === slug);
  if (!category) return null;
  const child = subSlug ? category.children?.find(c => c.slug === subSlug) : null;
  if (subSlug && !child) return null;
  const artworks = (await artworksFor(child || category)).filter(isPurchasable);
  return { category, child, artworks };
}

// The Shop menu with how many pieces are for sale in each category and sub-category.
export async function getShopMenu() {
  return Promise.all(SHOP_CATEGORIES.map(async category => {
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
