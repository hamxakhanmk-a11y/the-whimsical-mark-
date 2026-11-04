import { NextResponse } from 'next/server';
import { listShopifyCollections } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

// The store's Shopify collections (public information), for choosing them in the CMS Shop tab.
export async function GET() {
  return NextResponse.json(await listShopifyCollections());
}
