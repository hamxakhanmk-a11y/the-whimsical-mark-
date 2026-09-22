// Shopify public storefront integration — uses public JSON endpoints.
// No auth token needed; store just needs "Online Store" sales channel enabled.

const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(text) {
  return String(text || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractSeriesTagName(tags) {
  if (!Array.isArray(tags)) return null;
  const tag = tags.find(t => typeof t === 'string' && t.toLowerCase().startsWith('series:'));
  if (!tag) return null;
  return tag.split(':').slice(1).join(':').trim();
}

export function shopifyToArtwork(product) {
  if (!product) return null;
  const firstVariant = product.variants?.[0] || {};
  const firstImage = product.images?.[0] || {};
  const bodyText = (product.body_html || '').replace(/<[^>]*>/g, '').trim();
  const priceNumber = Number(firstVariant.price || 0);
  const priceLabel = priceNumber > 0
    ? `PKR ${priceNumber.toLocaleString('en-PK')}`
    : '';

  const tags = Array.isArray(product.tags) ? product.tags : [];
  const findTag = (prefix) => {
    const tag = tags.find(t => typeof t === 'string' && t.toLowerCase().startsWith(prefix + ':'));
    return tag ? tag.split(':').slice(1).join(':').trim() : '';
  };
  const normalizedTags = tags.map(t => String(t).toLowerCase());

  const seriesTagName = extractSeriesTagName(tags);
  const seriesTagSlug = seriesTagName ? slugify(seriesTagName) : null;

  let section = 'portfolio';
  if (normalizedTags.includes('commissions') || String(product.product_type || '').toLowerCase() === 'commissions') {
    section = 'commissions';
  }

  return {
    id: product.handle,
    shopify_id: product.id,
    variant_id: firstVariant.id,
    handle: product.handle,
    title: product.title,
    description: bodyText,
    medium: findTag('medium'),
    size: findTag('size'),
    price: priceLabel,
    image_url: firstImage.src || '',
    available: firstVariant.available !== false,
    section,
    display_order: parseInt(String(product.id).slice(-3), 10) || 1,
    tags,
    // Series info from tag (if used); collection-based series is added separately
    series_name: seriesTagName,
    series_slug: seriesTagSlug,
    images: (product.images || []).map(img => ({
      id: img.id,
      image_url: img.src,
      caption: '',
    })),
  };
}

async function fetchAllProducts() {
  if (!STORE_DOMAIN) return [];
  try {
    const url = `https://${STORE_DOMAIN}/products.json?limit=250`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.products) ? json.products : [];
  } catch { return []; }
}

async function fetchProductByHandle(handle) {
  if (!STORE_DOMAIN || !handle) return null;
  try {
    const url = `https://${STORE_DOMAIN}/products/${encodeURIComponent(handle)}.json`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.product || null;
  } catch { return null; }
}

async function fetchAllCollections() {
  if (!STORE_DOMAIN) return [];
  try {
    const url = `https://${STORE_DOMAIN}/collections.json?limit=250`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.collections) ? json.collections : [];
  } catch { return []; }
}

async function fetchCollectionProducts(handle) {
  if (!STORE_DOMAIN || !handle) return [];
  try {
    const url = `https://${STORE_DOMAIN}/collections/${encodeURIComponent(handle)}/products.json?limit=250`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.products) ? json.products : [];
  } catch { return []; }
}

// Collections whose title starts with "series" — each one is a separate series
async function fetchSeriesCollections() {
  const all = await fetchAllCollections();
  return all.filter(c =>
    /^series\b/i.test(String(c.title || '')) ||
    /^series[-_ ]/i.test(String(c.handle || ''))
  );
}

async function fetchCommissionProductIds() {
  const handles = [
    'commissions', 'commission', 'commissioned', 'commissioned-works',
    'comissions', 'comission', 'comissioned', // common spelling typos
  ];
  const idSet = new Set();
  for (const h of handles) {
    const list = await fetchCollectionProducts(h);
    list.forEach(p => idSet.add(p.id));
  }
  return idSet;
}

// Portfolio page: regular artworks + one card per series
export async function getPortfolioAndSeries() {
  const [allProducts, commissionIds, seriesCollections] = await Promise.all([
    fetchAllProducts(),
    fetchCommissionProductIds(),
    fetchSeriesCollections(),
  ]);

  // Fetch products for each series collection in parallel
  const seriesData = await Promise.all(
    seriesCollections.map(async (col) => {
      const products = await fetchCollectionProducts(col.handle);
      return {
        collection: col,
        products,
        productIds: new Set(products.map(p => p.id)),
      };
    })
  );

  // Any product that lives in a series collection is NOT shown as an individual card
  const idsInSeriesCollections = new Set();
  seriesData.forEach(s => s.productIds.forEach(id => idsInSeriesCollections.add(id)));

  // Individuals = not commission, not in a series collection, no series tag
  const individualsRaw = allProducts.filter(p => {
    if (commissionIds.has(p.id)) return false;
    if (idsInSeriesCollections.has(p.id)) return false;
    const a = shopifyToArtwork(p);
    if (!a) return false;
    if (a.section === 'commissions') return false;
    if (a.series_slug) return false; // series-by-tag also gets grouped
    return true;
  });
  const individuals = individualsRaw.map(shopifyToArtwork).filter(Boolean);

  // Collection-based series cards
  const collectionSeriesCards = seriesData
    .filter(s => s.products.length > 0)
    .map(s => {
      const artworks = s.products.map(shopifyToArtwork).filter(Boolean);
      return {
        is_series: true,
        slug: s.collection.handle,
        name: s.collection.title,
        cover_image: artworks[0]?.image_url || '',
        artworks,
      };
    });

  // Tag-based series cards (from products with "series:name" tag,
  // but only those that aren't already in a series collection)
  const tagSeriesMap = new Map();
  for (const p of allProducts) {
    if (commissionIds.has(p.id)) continue;
    if (idsInSeriesCollections.has(p.id)) continue;
    const a = shopifyToArtwork(p);
    if (!a || !a.series_slug || a.section === 'commissions') continue;
    if (!tagSeriesMap.has(a.series_slug)) {
      tagSeriesMap.set(a.series_slug, {
        is_series: true,
        slug: a.series_slug,
        name: a.series_name || titleCase(a.series_slug),
        cover_image: a.image_url,
        artworks: [],
      });
    }
    tagSeriesMap.get(a.series_slug).artworks.push(a);
  }
  const tagSeriesCards = Array.from(tagSeriesMap.values());

  const series = [...collectionSeriesCards, ...tagSeriesCards];
  return { individuals, series };
}

export async function getCommissionArtworks() {
  const [allProducts, commissionIds] = await Promise.all([
    fetchAllProducts(),
    fetchCommissionProductIds(),
  ]);
  return allProducts
    .filter(p => commissionIds.has(p.id) || String(p.product_type || '').toLowerCase() === 'commissions' ||
      (Array.isArray(p.tags) && p.tags.map(t => String(t).toLowerCase()).includes('commissions')))
    .map(p => {
      const a = shopifyToArtwork(p);
      if (a) a.section = 'commissions';
      return a;
    })
    .filter(Boolean);
}

export async function getNewestArtworks(limit = 4) {
  const products = await fetchAllProducts();
  return products.slice(0, limit).map(shopifyToArtwork).filter(Boolean);
}

export async function getArtworkByHandle(handle) {
  const product = await fetchProductByHandle(handle);
  return shopifyToArtwork(product);
}

// Given a series slug, return the series (from either collection or tag)
export async function getSeriesBySlug(slug) {
  // Try collection first
  const collectionProducts = await fetchCollectionProducts(slug);
  if (collectionProducts.length > 0) {
    // Get collection info for the title
    const allCollections = await fetchAllCollections();
    const col = allCollections.find(c => c.handle === slug);
    const artworks = collectionProducts.map(shopifyToArtwork).filter(Boolean);
    return {
      slug,
      name: col?.title || titleCase(slug),
      cover_image: artworks[0]?.image_url || '',
      artworks,
    };
  }
  // Fall back to tag-based
  const products = await fetchAllProducts();
  const artworks = products.map(shopifyToArtwork).filter(a => a && a.series_slug === slug);
  if (artworks.length === 0) return null;
  return {
    slug,
    name: artworks[0].series_name || titleCase(slug),
    cover_image: artworks[0].image_url,
    artworks,
  };
}

export function getCheckoutUrl(variantId, quantity = 1) {
  if (!STORE_DOMAIN || !variantId) return '#';
  return `https://${STORE_DOMAIN}/cart/${variantId}:${quantity}`;
}
