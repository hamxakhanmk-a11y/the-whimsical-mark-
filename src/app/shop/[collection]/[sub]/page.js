export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import ShopCategoryView from '@/components/ShopCategoryView';
import { getShopCategory } from '@/lib/shopCategories';

export async function generateMetadata(props) {
  const { collection, sub } = await props.params;
  const found = await getShopCategory(collection, sub);
  return { title: `${found?.child?.title || 'Shop'} | The Whimsical Mark` };
}

// A sub-category, e.g. /shop/bookmarks/embroidered
export default async function ShopSubCategoryPage(props) {
  const { collection, sub } = await props.params;
  const found = await getShopCategory(collection, sub);
  if (!found) notFound();
  return <ShopCategoryView {...found} />;
}
