export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ArtworkEditorialView from '@/components/ArtworkEditorialView';
import { siteConfig } from '@/data/config';
import { getArtworkByHandle, getCheckoutUrl } from '@/lib/shopify';

async function getWhatsapp() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data } = await supabase
      .from('site_text')
      .select('value')
      .eq('key', 'contact_whatsapp')
      .single();
    return data?.value || siteConfig.whatsapp;
  } catch { return siteConfig.whatsapp; }
}

export default async function ArtworkDetailPage(props) {
  const { id } = await props.params; // "id" is actually the Shopify handle
  const [artwork, whatsapp] = await Promise.all([
    getArtworkByHandle(id),
    getWhatsapp(),
  ]);

  if (!artwork) notFound();

  const whatsappNumber = String(whatsapp || '').replace(/\D/g, '');
  const checkoutUrl = getCheckoutUrl(artwork.variant_id);

  return (
    <>
      <ArtworkEditorialView
        artwork={artwork}
        images={artwork.images}
        whatsappNumber={whatsappNumber}
        checkoutUrl={checkoutUrl}
      />
    </>
  );
}
