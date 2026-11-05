import ReviewsSection from '@/components/ReviewsSection';
import { getPublishedReviews } from '@/lib/reviews';

// "Kind Words": visitor reviews and a form to leave one (Home and Contact pages).
export default async function Reviews() {
  const reviews = await getPublishedReviews();
  return <ReviewsSection initialReviews={reviews} />;
}
