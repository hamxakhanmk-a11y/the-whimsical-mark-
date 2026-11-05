import Contact from '@/components/Contact';
import Reviews from '@/components/Reviews';

export const dynamic = 'force-dynamic';

export default function ContactPage() {
  return (
    <>
      <main className="pt-20">
        <Contact />
        <Reviews />
      </main>
    </>
  );
}
