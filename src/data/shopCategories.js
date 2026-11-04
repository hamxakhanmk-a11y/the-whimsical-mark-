// The Shop's categories, in menu order. Each points at Shopify collections, matched by handle or title
// (any letter case), so a collection can keep whatever name it has in Shopify; add products to it there
// and they appear here. A category with nothing for sale shows "Coming soon".
// Paintings are the paintings in the Portfolio collection.
export const SHOP_CATEGORIES = [
  { slug: 'paintings', title: 'Paintings', match: ['portfolio', 'portfolios'], paintings: true },
  {
    slug: 'bookmarks',
    title: 'Bookmarks',
    children: [
      { slug: 'embroidered', title: 'Embroidered Bookmarks', match: ['painted-bookmarks-copy', 'embroided bookmarks', 'embroidered bookmarks', 'embroidered-bookmarks'] },
      { slug: 'marker', title: 'Marker Bookmarks', match: ['marker-marks', 'marker marks', 'marker bookmarks', 'marker-bookmarks'] },
      { slug: 'painted', title: 'Painted Bookmarks', match: ['painted bookmarks', 'painted-bookmarks'] },
    ],
  },
  { slug: 'envelopes', title: 'Envelopes', match: ['envelopes', 'envelope'] },
  { slug: 'charms', title: 'Charms', match: ['charms', 'charm'] },
  { slug: 'bags', title: 'Bags', match: ['bags', 'bag'] },
];

export const shopHref = (category, child) => `/shop/${category.slug}${child ? `/${child.slug}` : ''}`;
