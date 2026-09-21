// Shopify public storefront integration — uses the public products.json endpoint
// No auth token needed; store just needs "Online Store" sales channel enabled.

const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';

// Convert a Shopify product to the artwork shape our components expect
export function shopifyToArtwork(product) {
  if (!product) return null;
  const firstVariant = product.variants?.[0] || {};
  const firstImage = product.images?.[0] || {};
  const bodyText = (product.body_html || '').replace(/<[^>]*>/g, '').trim();
  const priceNumber = Number(firstVariant.price || 0);
  const priceLabel = priceNumber > 0
    ? `PKR ${priceNumber.toLocaleString('en-PK')}`
    : '';

  // Extract medium / size from tags formatted like "medium:Oil on Canvas" or "size:24x36"
  const tags = Array.isArray(product.tags) ? product.tags : [];
  const findTag = (prefix) => {
    const tag = tags.find(t => typeof t === 'string' && t.toLowerCase().startsWith(prefix + ':'));
    return tag ? tag.split(':').slice(1).join(':').trim() : '';
  };

  const section = tags.map(t => String(t).toLowerCase()).includes('commissions')
    ? 'commissions'
    : 'portfolio';

  return {
    id: product.handle,                    // use handle for URLs
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
    display_order: product.id,
    tags,
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

// Public API used by pages

export async function getPortfolioArtworks() {
  const products = await fetchAllProducts();
  return products
    .map(shopifyToArtwork)
    .filter(a => a && a.section === 'portfolio');
}

export async function getCommissionArtworks() {
  const products = await fetchAllProducts();
  return products
    .map(shopifyToArtwork)
    .filter(a => a && a.section === 'commissions');
}

export async function getNewestArtworks(limit = 4) {
  const products = await fetchAllProducts();
  return products
    .slice(0, limit)
    .map(shopifyToArtwork)
    .filter(Boolean);
}

export async function getArtworkByHandle(handle) {
  const product = await fetchProductByHandle(handle);
  return shopifyToArtwork(product);
}

// Cart permalink — adds variant to cart and takes user to Shopify checkout
export function getCheckoutUrl(variantId, quantity = 1) {
  if (!STORE_DOMAIN || !variantId) return '#';
  return `https://${STORE_DOMAIN}/cart/${variantId}:${quantity}`;
}
