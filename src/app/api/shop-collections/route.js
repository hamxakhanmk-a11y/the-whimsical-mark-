import { NextResponse } from 'next/server';
import { getShopMenu } from '@/lib/shopCategories';

export const dynamic = 'force-dynamic';

// The Shop menu: each category (and sub-category) with how many pieces are for sale in it.
export async function GET() {
  return NextResponse.json(await getShopMenu());
}
