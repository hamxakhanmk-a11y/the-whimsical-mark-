import { createClient } from '@supabase/supabase-js';
import { getPortfolioAndSeries, getCommissionArtworks } from '@/lib/shopify';

// The CMS saves the display order as a JSON list of keys in site_text:
//   layout_portfolio   -> ["series:starry-nights", "artwork:tannins-and-tendrils", ...]
//   layout_commissions -> ["artwork:some-handle", ...]
export async function getSavedLayout(section) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data } = await supabase
      .from('site_text')
      .select('value')
      .eq('key', `layout_${section}`)
      .maybeSingle();
    const keys = JSON.parse(data?.value || '[]');
    return Array.isArray(keys) ? keys : [];
  } catch {
    return [];
  }
}

// Items the CMS hasn't placed yet (e.g. a new Shopify product) go after the arranged ones.
export function sortByLayout(items, keys) {
  const rank = new Map(keys.map((key, index) => [key, index]));
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ra = rank.has(a.item.key) ? rank.get(a.item.key) : Infinity;
      const rb = rank.has(b.item.key) ? rank.get(b.item.key) : Infinity;
      if (ra !== rb) return ra < rb ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

export async function getPortfolioItems() {
  const [{ individuals, series }, keys] = await Promise.all([
    getPortfolioAndSeries(),
    getSavedLayout('portfolio'),
  ]);
  const items = [
    ...series.map(s => ({ key: `series:${s.slug}`, kind: 'series', payload: s })),
    ...individuals.map(a => ({ key: `artwork:${a.handle}`, kind: 'artwork', payload: a })),
  ];
  return sortByLayout(items, keys);
}

export async function getCommissionItems() {
  const [artworks, keys] = await Promise.all([
    getCommissionArtworks(),
    getSavedLayout('commissions'),
  ]);
  const items = artworks.map(a => ({ key: `artwork:${a.handle}`, kind: 'artwork', payload: a }));
  return sortByLayout(items, keys);
}
