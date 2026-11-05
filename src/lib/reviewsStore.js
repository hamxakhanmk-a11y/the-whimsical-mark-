import { supabaseAdmin } from '@/lib/supabase';
import { parseReviews } from '@/lib/reviews';

const KEY = 'reviews';
const MAX_REVIEWS = 500;
const newestFirst = (a, b) => String(b.date).localeCompare(String(a.date));

// Server-only (uses the admin database key): changes the saved review list safely even if two people post
// at the same moment. The save only goes through if nobody else saved in between; otherwise it re-reads
// and tries again.
export async function updateReviews(change) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: row, error: readError } = await supabaseAdmin
      .from('site_text').select('value,updated_at').eq('key', KEY).maybeSingle();
    if (readError) throw readError;
    const next = change(parseReviews(row?.value)).sort(newestFirst).slice(0, MAX_REVIEWS);
    const value = JSON.stringify(next);
    const now = new Date().toISOString();

    if (!row) {
      const { error } = await supabaseAdmin.from('site_text').insert({ key: KEY, value, updated_at: now });
      if (!error) return next;
      continue; // someone else created it first; go round again
    }

    let query = supabaseAdmin.from('site_text').update({ value, updated_at: now }).eq('key', KEY);
    query = row.updated_at ? query.eq('updated_at', row.updated_at) : query.is('updated_at', null);
    const { data, error } = await query.select('key');
    if (error) throw error;
    if (data?.length) return next;
    await new Promise(resolve => setTimeout(resolve, 60 + Math.random() * 140));
  }
  throw new Error('The reviews are busy right now. Please try again.');
}
