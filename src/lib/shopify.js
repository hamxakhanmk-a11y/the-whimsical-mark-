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

function extractSeriesName(tags) {
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

  const seriesName = extractSeriesName(tags);
  const seriesSlug = seriesName ? slugify(seriesName) : null;

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
    series_name: seriesName,
    series_slug: seriesSlug,
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

// Fetch products belonging to a specific Shopify collection (by handle)
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

// Try common commission collection handles Shopify might have generated
async function getCommissionProductIds() {
  const handles = ['commissions', 'commission', 'commissioned', 'commissioned-works'];
  const idSet = new Set();
  for (const h of handles) {
    const list = await fetchCollectionProducts(h);
    list.forEach(p => idSet.add(p.id));
    if (list.length > 0) break; // stop once one collection has products
  }
  return idSet;
}

async function getSeriesProductIds() {
  const list = await fetchCollectionProducts('series');
  return new Set(list.map(p => p.id));
}

// Portfolio page: regular artworks + one card per series
export async function getPortfolioAndSeries() {
  const [allProducts, commissionIds] = await Promise.all([
    fetchAllProducts(),
    getCommissionProductIds(),
  ]);

  // Everything NOT in commissions collection AND NOT tagged as commissions
  const portfolioProducts = allProducts.filter(p => {
    if (commissionIds.has(p.id)) return false;
    const artwork = shopifyToArtwork(p);
    return artwork && artwork.section !== 'commissions';
  });

  const all = portfolioProducts.map(shopifyToArtwork).filter(Boolean);
  const individuals = all.filter(a => !a.series_slug);

  const seriesMap = new Map();
  for (const a of all) {
    if (!a.series_slug) continue;
    if (!seriesMap.has(a.series_slug)) {
      seriesMap.set(a.series_slug, {
        is_series: true,
        slug: a.series_slug,
        name: a.series_name || titleCase(a.series_slug),
        cover_image: a.image_url,
        artworks: [],
      });
    }
    seriesMap.get(a.series_slug).artworks.push(a);
  }
  const seriesCards = Array.from(seriesMap.values());

  return { individuals, series: seriesCards };
}

export async function getCommissionArtworks() {
  const [allProducts, commissionIds] = await Promise.all([
    fetchAllProducts(),
    getCommissionProductIds(),
  ]);
  const commissionProducts = allProducts.filter(p => {
    if (commissionIds.has(p.id)) return true;
    const artwork = shopifyToArtwork(p);
    return artwork && artwork.section === 'commissions';
  });
  return commissionProducts
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

export async function getSeriesBySlug(slug) {
  const products = await fetchAllProducts();
  const artworks = products
    .map(shopifyToArtwork)
    .filter(a => a && a.series_slug === slug);
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
