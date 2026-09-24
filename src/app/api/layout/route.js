import { NextResponse } from 'next/server';
import { getPortfolioItems, getCommissionItems } from '@/lib/layout';

export const dynamic = 'force-dynamic';

function toCard(item) {
  const p = item.payload;
  return item.kind === 'series'
    ? { key: item.key, kind: 'series', title: p.name, image_url: p.cover_image, count: p.artworks.length }
    : { key: item.key, kind: 'artwork', title: p.title, image_url: p.image_url };
}

export async function GET() {
  const [portfolio, commissions] = await Promise.all([getPortfolioItems(), getCommissionItems()]);
  return NextResponse.json({
    portfolio: portfolio.map(toCard),
    commissions: commissions.map(toCard),
  });
}
