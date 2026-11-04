export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ArtworkEditorialView from '@/components/ArtworkEditorialView';
import { siteConfig } from '@/data/config';
import { getArtworkByHandle, getCommissionArtworks } from '@/lib/shopify';
import { getPaintings } from '@/lib/shopCategories';

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
  const [artwork, whatsapp, paintings, commissions] = await Promise.all([
    getArtworkByHandle(id),
    getWhatsapp(),
    getPaintings(),
    getCommissionArtworks(),
  ]);

  if (!artwork) notFound();

  // "← back" leads to the page this piece is shown on
  const back = paintings.some(a => a.handle === artwork.handle) ? { href: '/paintings', label: 'Paintings' }
    : artwork.section === 'commissions' || commissions.some(a => a.handle === artwork.handle) ? { href: '/commissions', label: 'Commissions' }
    : { href: '/portfolio', label: 'Portfolio' };

  const whatsappNumber = String(whatsapp || '').replace(/\D/g, '');

  return (
    <>
      <ArtworkEditorialView
        artwork={artwork}
        images={artwork.images}
        whatsappNumber={whatsappNumber}
        back={back}
      />
    </>
  );
}
