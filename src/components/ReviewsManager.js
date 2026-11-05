'use client';

import { useCallback, useEffect, useState } from 'react';

const formatDate = iso => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

// CMS "Reviews" tab: every visitor review, with Hide/Show and Delete, and the "approve first" switch.
export default function ReviewsManager({ token }) {
  const [reviews, setReviews] = useState(null);
  const [approval, setApproval] = useState(false);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);
  const auth = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/reviews?all=1', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.reviews)) throw new Error(data.error || 'Could not load the reviews.');
      setReviews(data.reviews);
      setApproval(Boolean(data.approval));
    } catch (error) {
      setReviews([]);
      setMessage(`Error: ${error.message}`);
    }
  }, [token]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void load(); });
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  async function send(method, body, query = '') {
    const response = await fetch(`/api/reviews${query}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...auth },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not save.');
    return data;
  }

  async function setHidden(review, hidden) {
    setBusyId(review.id);
    try {
      const data = await send('PATCH', { id: review.id, hidden });
      setReviews(data.reviews);
      setMessage(hidden ? '✓ Review hidden from the website.' : '✓ Review is now shown on the website.');
    } catch (error) { setMessage(`Error: ${error.message}`); }
    setBusyId(null);
  }

  async function remove(review) {
    if (!window.confirm(`Delete the review from “${review.name}”? This can’t be undone.`)) return;
    setBusyId(review.id);
    try {
      const data = await send('DELETE', null, `?id=${encodeURIComponent(review.id)}`);
      setReviews(data.reviews);
      setMessage('✓ Review deleted.');
    } catch (error) { setMessage(`Error: ${error.message}`); }
    setBusyId(null);
  }

  async function toggleApproval() {
    const next = !approval;
    try {
      await send('PATCH', { approval: next });
      setApproval(next);
      setMessage(next ? '✓ New reviews now wait for your approval.' : '✓ New reviews now appear straight away.');
    } catch (error) { setMessage(`Error: ${error.message}`); }
  }

  const waiting = (reviews || []).filter(r => r.hidden).length;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-neutral-400">Visitor Reviews</p>
        <h2 className="text-4xl font-light" style={{ fontFamily: 'var(--font-cormorant)' }}>Reviews</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">
          Reviews visitors leave on the Home and Contact pages. Hide one to take it off the website (you can show it again),
          or delete it for good.
        </p>
      </div>

      <section className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-medium text-neutral-800">Approve reviews before they appear</p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            {approval ? 'On: new reviews stay hidden until you press Show.' : 'Off: new reviews appear on the website straight away.'}
          </p>
        </div>
        <button type="button" role="switch" aria-checked={approval} onClick={toggleApproval}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${approval ? 'bg-[#2d7d6b]' : 'bg-neutral-300'}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${approval ? 'left-6' : 'left-1'}`} />
          <span className="sr-only">Approve reviews before they appear</span>
        </button>
      </section>

      {message && <p className={`text-xs ${message.startsWith('✓') ? 'text-green-700' : 'text-red-600'}`}>{message}</p>}

      {reviews === null ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div className="border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-400">No reviews yet.</div>
      ) : (
        <>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}{waiting ? ` · ${waiting} hidden` : ''}
          </p>
          <ul className="flex flex-col gap-3">
            {reviews.map(review => (
              <li key={review.id} className={`border bg-white p-4 sm:p-5 ${review.hidden ? 'border-amber-300 bg-amber-50/40' : 'border-neutral-200'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-neutral-800">{review.name}</span>
                    <span className="text-sm tracking-wider text-[#c19875]" aria-label={`${review.rating} out of 5 stars`}>
                      {'★'.repeat(review.rating)}<span className="text-neutral-300">{'★'.repeat(5 - review.rating)}</span>
                    </span>
                    <span className="text-xs text-neutral-400">{formatDate(review.date)}</span>
                    {review.hidden && <span className="bg-amber-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-800">Hidden</span>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={busyId === review.id} onClick={() => setHidden(review, !review.hidden)}
                      className="border border-neutral-200 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-neutral-700 hover:border-neutral-700 disabled:opacity-40">
                      {review.hidden ? 'Show' : 'Hide'}
                    </button>
                    <button type="button" disabled={busyId === review.id} onClick={() => remove(review)}
                      className="border border-neutral-200 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-red-600 hover:border-red-600 disabled:opacity-40">
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-neutral-600">{review.message}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
