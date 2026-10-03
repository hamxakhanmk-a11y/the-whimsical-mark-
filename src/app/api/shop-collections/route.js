import { NextResponse } from 'next/server';
import { getShopCollections } from '@/lib/layout';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { tabs } = await getShopCollections();
  return NextResponse.json(tabs.map(c => ({ handle: c.handle, title: c.title, count: c.artworks.length })));
}
