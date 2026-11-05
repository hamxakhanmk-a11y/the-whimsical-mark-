'use client';

import { useId, useState } from 'react';
import { REVIEW_LIMITS } from '@/data/reviewLimits';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Same text on the server and in the browser (no locale differences).
const formatDate = iso => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

function Stars({ value, size = 'h-4 w-4' }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} className={size} viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z"
            fill={n <= Math.round(value) ? '#c19875' : 'none'} stroke="#c19875" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

const PAGE = 6;

export default function ReviewsSection({ initialReviews = [] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [shown, setShown] = useState(PAGE);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', rating: 0, message: '', trap: '' });
  const [hoverRating, setHoverRating] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [status, setStatus] = useState({ state: 'idle', text: '' });
  const ids = useId();

  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count : 0;

  // typing or picking stars clears an old "please…" message
  const update = patch => {
    setForm(f => ({ ...f, ...patch }));
    setStatus(current => (current.state === 'error' ? { state: 'idle', text: '' } : current));
  };

  const openForm = () => {
    setFormOpen(true);
    setStartedAt(Date.now());
    setStatus({ state: 'idle', text: '' });
  };

  async function submit(event) {
    event.preventDefault();
    if (form.name.trim().length < 2) return setStatus({ state: 'error', text: 'Please write your name.' });
    if (!form.rating) return setStatus({ state: 'error', text: 'Please choose a star rating.' });
    if (form.message.trim().length < REVIEW_LIMITS.minMessage) return setStatus({ state: 'error', text: 'Please write a few more words.' });

    setStatus({ state: 'sending', text: 'Posting your review…' });
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, elapsed: Date.now() - startedAt }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not post your review. Please try again.');
      if (data.review) setReviews(current => [data.review, ...current]);
      setForm({ name: '', rating: 0, message: '', trap: '' });
      setFormOpen(false);
      setStatus({
        state: 'done',
        text: data.pending ? 'Thank you! Your review will appear here once it has been approved.' : 'Thank you! Your review is now on the page.',
      });
    } catch (error) {
      setStatus({ state: 'error', text: error.message });
    }
  }

  const field = 'w-full rounded-xl border border-[#2d7d6b]/20 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#2d7d6b] focus:outline-none focus:ring-2 focus:ring-[#4ea87c]/25';
  const label = 'mb-1.5 block text-[11px] font-medium uppercase tracking-[0.2em] text-[#1f4d43]';

  return (
    <section id="reviews" aria-labelledby={`${ids}-title`} className="bg-[#fffaf2] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--color-coral)' }}>Reviews</p>
          <h2 id={`${ids}-title`} className="text-4xl font-light text-neutral-900 sm:text-5xl" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Kind Words
          </h2>
          <div className="mx-auto mt-6 h-px w-8 bg-neutral-300" />
          {count > 0 ? (
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-neutral-600">
              <Stars value={average} size="h-5 w-5" />
              <span><strong className="font-semibold text-[#1f4d43]">{average.toFixed(1)}</strong> out of 5 · {count} {count === 1 ? 'review' : 'reviews'}</span>
            </p>
          ) : (
            <p className="mt-6 text-sm leading-relaxed text-neutral-500">No reviews yet. Bought a piece or commissioned one? Be the first to share your thoughts.</p>
          )}
        </div>

        {count > 0 && (
          <ul className="mt-12 flex flex-wrap justify-center gap-4 sm:gap-6">
            {reviews.slice(0, shown).map(review => (
              <li key={review.id} className="flex w-full flex-col rounded-2xl sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] border border-[#2d7d6b]/12 bg-white p-6 shadow-[0_10px_30px_rgba(31,77,67,.07)]">
                <Stars value={review.rating} />
                <p className="mt-4 flex-1 whitespace-pre-line break-words text-[15px] leading-relaxed text-neutral-700">“{review.message}”</p>
                <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-neutral-100 pt-4">
                  <span className="truncate text-sm font-medium text-[#1f4d43]">{review.name}</span>
                  <time dateTime={review.date} className="shrink-0 text-xs text-neutral-400">{formatDate(review.date)}</time>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex flex-col items-center gap-4">
          {shown < count && (
            <button type="button" onClick={() => setShown(n => n + PAGE)} className="glass-btn glass-btn--outline">
              Show more reviews
            </button>
          )}
          {status.state === 'done' && (
            <p role="status" className="rounded-full bg-[#4ea87c]/12 px-5 py-2 text-sm text-[#1f4d43]">{status.text}</p>
          )}
          {!formOpen && (
            <button type="button" onClick={openForm} className="glass-btn glass-btn--solid">Write a review</button>
          )}
        </div>

        {formOpen && (
          <form onSubmit={submit} noValidate className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#2d7d6b]/15 bg-white p-5 shadow-[0_18px_44px_rgba(31,77,67,.1)] sm:p-8">
            <h3 className="mb-6 text-center text-2xl font-light text-neutral-900" style={{ fontFamily: 'var(--font-cormorant)' }}>Share your experience</h3>

            <fieldset className="mb-5">
              <legend className={label}>Your rating</legend>
              <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => update({ rating: n })} onMouseEnter={() => setHoverRating(n)}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`} aria-pressed={form.rating === n}
                    className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4ea87c]">
                    <svg className="h-8 w-8" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z"
                        fill={n <= (hoverRating || form.rating) ? '#c19875' : 'none'} stroke="#c19875" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="mb-5 block">
              <span className={label}>Your name</span>
              <input value={form.name} onChange={e => update({ name: e.target.value })} maxLength={REVIEW_LIMITS.name}
                autoComplete="name" className={field} placeholder="e.g. Ayesha K." />
            </label>

            <label className="mb-2 block">
              <span className={label}>Your review</span>
              <textarea value={form.message} onChange={e => update({ message: e.target.value })} maxLength={REVIEW_LIMITS.message}
                rows={5} className={`${field} resize-y`} placeholder="What did you love about your piece?" />
            </label>
            <p className="mb-5 text-right text-[11px] text-neutral-400">{form.message.length}/{REVIEW_LIMITS.message}</p>

            {/* hidden from people; bots fill it in */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>Leave this empty<input tabIndex={-1} autoComplete="off" data-lpignore="true" data-1p-ignore value={form.trap} onChange={e => setForm(f => ({ ...f, trap: e.target.value }))} /></label>
            </div>

            {status.state === 'error' && <p role="alert" className="mb-4 text-center text-sm text-red-600">{status.text}</p>}
            <p className="mb-5 text-center text-xs text-neutral-400">Your name and review will be shown on this page.</p>
            <div className="flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
              <button type="button" onClick={() => setFormOpen(false)} className="px-5 py-2 text-xs uppercase tracking-[0.2em] text-neutral-500 hover:text-neutral-800">Cancel</button>
              <button type="submit" disabled={status.state === 'sending'} className="glass-btn glass-btn--solid disabled:opacity-50">
                {status.state === 'sending' ? 'Posting…' : 'Post review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
