const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';

// Shopify cart permalink: /cart/VARIANT:QTY,VARIANT:QTY opens checkout with all lines.
export function cartCheckoutUrl(lines) {
  const valid = (lines || []).filter(line => line && line.variantId);
  if (!STORE_DOMAIN || valid.length === 0) return '#';
  return `https://${STORE_DOMAIN}/cart/${valid.map(line => `${line.variantId}:${line.quantity || 1}`).join(',')}`;
}

export function formatPrice(amount) {
  const value = Number(amount || 0);
  return value > 0 ? `PKR ${value.toLocaleString('en-PK')}` : '';
}

export function isPurchasable(artwork) {
  return Boolean(artwork && artwork.available && artwork.variant_id && artwork.price_amount > 0);
}

export function toCartItem(artwork) {
  return {
    variantId: artwork.variant_id,
    handle: artwork.handle,
    title: artwork.title,
    image: artwork.image_url,
    amount: artwork.price_amount,
  };
}
