import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import {
  REVIEW_LIMITS, getAllReviews, getPublishedReviews, getReviewApproval, publicReview,
} from '@/lib/reviews';
import { updateReviews } from '@/lib/reviewsStore';

export const dynamic = 'force-dynamic';

const isAdmin = req => Boolean(process.env.ADMIN_SECRET) && req.headers.get('authorization') === `Bearer ${process.env.ADMIN_SECRET}`;
const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// A light brake on repeated posting from one connection (per server instance; resets on its own).
const recentPosts = new Map();
function tooManyPosts(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const times = (recentPosts.get(ip) || []).filter(t => now - t < windowMs);
  if (times.length >= 3) return true;
  times.push(now);
  recentPosts.set(ip, times);
  if (recentPosts.size > 5000) recentPosts.clear();
  return false;
}

// Visitors: the shown reviews. Admin (?all=1 with the admin token): every review and the approval setting.
export async function GET(req) {
  if (new URL(req.url).searchParams.get('all')) {
    if (!isAdmin(req)) return fail('Unauthorized. Please log out and log in again.', 401);
    const [reviews, approval] = await Promise.all([getAllReviews(), getReviewApproval()]);
    return NextResponse.json({ reviews, approval });
  }
  return NextResponse.json(await getPublishedReviews());
}

// Anyone: post a review.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail('Something went wrong. Please try again.'); }

  // Bots fill in the hidden "website" field, or send the form instantly; quietly accept and drop those.
  const startedAt = Number(body.startedAt);
  if (body.website || !startedAt || Date.now() - startedAt < 3000) return NextResponse.json({ ok: true, pending: true });

  const name = String(body.name || '').replace(/\s+/g, ' ').trim().slice(0, REVIEW_LIMITS.name);
  const message = String(body.message || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const rating = Math.round(Number(body.rating));
  if (name.length < 2) return fail('Please write your name.');
  if (!(rating >= 1 && rating <= 5)) return fail('Please choose a star rating.');
  if (message.length < REVIEW_LIMITS.minMessage) return fail('Please write a few more words.');
  if (message.length > REVIEW_LIMITS.message) return fail(`Please keep it under ${REVIEW_LIMITS.message} characters.`);
  if ((message.match(/https?:\/\/|www\./gi) || []).length > 1) return fail('Please leave out web links.');

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (tooManyPosts(ip)) return fail('Thank you! You have posted a few reviews already. Please try again later.', 429);

  try {
    const pending = await getReviewApproval();
    const review = { id: randomUUID(), name, rating, message, date: new Date().toISOString(), hidden: pending };
    await updateReviews(list => [review, ...list]);
    return NextResponse.json({ ok: true, pending, review: pending ? null : publicReview(review) });
  } catch {
    return fail('Could not save your review. Please try again.', 500);
  }
}

// Admin: show/hide a review ({ id, hidden }) or switch approval on/off ({ approval: true/false }).
export async function PATCH(req) {
  if (!isAdmin(req)) return fail('Unauthorized', 401);
  const body = await req.json().catch(() => ({}));
  try {
    if (typeof body.approval === 'boolean') {
      const { error } = await supabaseAdmin.from('site_text')
        .upsert({ key: 'reviews_approval', value: body.approval ? 'on' : 'off', updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
      return NextResponse.json({ approval: body.approval });
    }
    if (!body.id) return fail('Missing review.');
    const reviews = await updateReviews(list => list.map(r => (r.id === body.id ? { ...r, hidden: Boolean(body.hidden) } : r)));
    return NextResponse.json({ reviews });
  } catch (error) {
    return fail(error.message || 'Could not save.', 500);
  }
}

// Admin: delete a review (?id=...).
export async function DELETE(req) {
  if (!isAdmin(req)) return fail('Unauthorized', 401);
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return fail('Missing review.');
  try {
    const reviews = await updateReviews(list => list.filter(r => r.id !== id));
    return NextResponse.json({ reviews });
  } catch (error) {
    return fail(error.message || 'Could not delete.', 500);
  }
}
