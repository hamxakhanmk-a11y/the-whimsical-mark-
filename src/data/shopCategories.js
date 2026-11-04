// The Shop's starting categories, in menu order. The CMS Shop tab can change all of this (it saves its own
// version in site_text "shop_categories"); these are used until it does. Each points at Shopify collections, matched by handle or title
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
  { slug: 'hoop-art', title: 'Hoop Art', match: ['hoop-art', 'hoop art', 'hoopart', 'hoop-arts', 'hoop arts'] },
  { slug: 'charms', title: 'Charms', match: ['charms', 'charm'] },
  {
    slug: 'bags',
    title: 'Bags',
    match: ['bags', 'bag'],
    children: [
      { slug: 'tote', title: 'Tote Bags', short: 'Tote Bags', match: ['tote-bag', 'tote bag', 'tote bags', 'tote-bags'] },
      { slug: 'vanity-essentials', title: 'Vanity Essential Bags', short: 'Vanity Essentials', match: ['vanity-essentials', 'vanity essential bags', 'vanity essentials', 'vanity-essential-bags'] },
      { slug: 'potli', title: 'Potli Bags', short: 'Potli Bags', match: ['potli-bags', 'potli bags', 'potli-bag', 'potli bag', 'potli', 'potlis'] },
    ],
  },
];

// A URL-friendly name ("Silk & Zari" -> "silk-and-zari").
export const slugifyCategory = text => String(text || '').toLowerCase().replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// Tidies a category list saved from the CMS: drops nameless rows, gives each a unique URL name, keeps exactly
// one Paintings category (the Paintings page needs it). Returns null if nothing usable is left.
export function normalizeShopCategories(raw) {
  if (!Array.isArray(raw)) return null;
  const uniqueSlug = (base, used) => {
    let slug = base || 'category';
    for (let n = 2; used.has(slug); n++) slug = `${base || 'category'}-${n}`;
    used.add(slug);
    return slug;
  };
  const clean = (node, used) => {
    const title = String(node?.title || '').trim().slice(0, 60);
    if (!title) return null;
    const match = (Array.isArray(node.match) ? node.match : [])
      .map(name => String(name).trim().toLowerCase()).filter(Boolean).slice(0, 20);
    const out = { slug: uniqueSlug(slugifyCategory(node.slug) || slugifyCategory(title), used), title, match };
    const short = String(node.short || '').trim().slice(0, 40);
    if (short) out.short = short;
    return out;
  };
  const used = new Set(['all']); // "all" is the Shop All tab
  const categories = [];
  let hasPaintings = false;
  for (const node of raw) {
    const category = clean(node, used);
    if (!category) continue;
    if (node.paintings && !hasPaintings) {
      category.paintings = true;
      hasPaintings = true;
    } else if (Array.isArray(node.children)) {
      const childSlugs = new Set(['all']);
      const children = node.children.map(child => clean(child, childSlugs)).filter(Boolean);
      if (children.length) category.children = children;
    }
    categories.push(category);
  }
  if (!categories.length) return null;
  if (!hasPaintings) categories.unshift(SHOP_CATEGORIES.find(c => c.paintings));
  return categories;
}

export const shopHref = (category, child) => `/shop/${category.slug}${child ? `/${child.slug}` : ''}`;
