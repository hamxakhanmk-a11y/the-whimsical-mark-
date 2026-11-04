// The Shop's categories, in menu order. Each points at Shopify collections, matched by handle or title
// (any letter case), so a collection can keep whatever name it has in Shopify; add products to it there
// and they appear here. A category with nothing for sale shows "Coming soon".
// A category with types (Bookmarks, Envelopes, Bags) shows everything in its types, plus anything put
// straight into its own collection (e.g. "Envelopes"). `short` is the type's name on the Shop's small tabs.
// Paintings are the paintings in the Portfolio collection.
export const SHOP_CATEGORIES = [
  { slug: 'paintings', title: 'Paintings', match: ['portfolio', 'portfolios'], paintings: true },
  {
    slug: 'bookmarks',
    title: 'Bookmarks',
    match: ['bookmarks', 'bookmark'],
    children: [
      { slug: 'painted', title: 'Painted Bookmarks', short: 'Painted', match: ['painted bookmarks', 'painted-bookmarks'] },
      { slug: 'embroidered', title: 'Embroidered Bookmarks', short: 'Embroidered', match: ['painted-bookmarks-copy', 'embroided bookmarks', 'embroidered bookmarks', 'embroidered-bookmarks'] },
      { slug: 'marker', title: 'Marker Bookmarks', short: 'Marker', match: ['marker-marks', 'marker marks', 'marker bookmarks', 'marker-bookmarks'] },
    ],
  },
  {
    slug: 'envelopes',
    title: 'Envelopes',
    match: ['envelopes', 'envelope'],
    children: [
      { slug: 'silk-and-zari', title: 'Silk and Zari Envelopes', short: 'Silk & Zari', match: ['silk-and-zari-envelopes', 'silk and zari envelopes', 'silk & zari envelopes'] },
      { slug: 'embroidered', title: 'Embroidered Envelopes', short: 'Embroidered', match: ['embroided-envelopes', 'embroided envelopes', 'embroidered envelopes', 'embroidered-envelopes'] },
    ],
  },
  { slug: 'charms', title: 'Charms', match: ['charms', 'charm'] },
  {
    slug: 'bags',
    title: 'Bags',
    match: ['bags', 'bag'],
    children: [
      { slug: 'tote', title: 'Tote Bags', short: 'Tote Bags', match: ['tote-bag', 'tote bag', 'tote bags', 'tote-bags'] },
      { slug: 'vanity-essentials', title: 'Vanity Essential Bags', short: 'Vanity Essentials', match: ['vanity-essentials', 'vanity essential bags', 'vanity essentials', 'vanity-essential-bags'] },
    ],
  },
];

export const shopHref = (category, child) => `/shop/${category.slug}${child ? `/${child.slug}` : ''}`;
