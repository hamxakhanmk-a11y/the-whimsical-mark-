import { getSiteText } from '@/lib/savedLayout';

// Visitor reviews live in site_text as one JSON list (key "reviews"), newest first:
//   [{ id, name, rating (1-5), message, date (ISO), hidden (true = not shown on the site) }]
// The CMS setting "reviews_approval" = "on" makes new reviews wait (hidden) until approved in the Reviews tab.
const KEY = 'reviews';

export { REVIEW_LIMITS } from '@/data/reviewLimits';

export function parseReviews(raw) {
  try {
    const list = JSON.parse(raw || '[]');
    return Array.isArray(list) ? list.filter(r => r && r.id && r.name && r.message) : [];
  } catch {
    return [];
  }
}

const newestFirst = (a, b) => String(b.date).localeCompare(String(a.date));

// What visitors see: shown reviews only, without the "hidden" flag.
export const publicReview = ({ id, name, rating, message, date }) => ({ id, name, rating, message, date });

export async function getAllReviews() {
  return parseReviews(await getSiteText(KEY)).sort(newestFirst);
}

export async function getPublishedReviews() {
  return (await getAllReviews()).filter(r => !r.hidden).map(publicReview);
}

export async function getReviewApproval() {
  return (await getSiteText('reviews_approval')) === 'on';
}
