import { notFound } from 'next/navigation';
import { cities, getCityBySlug } from '@/lib/data/cities';
import CityPageLayout from '@/app/components/marketing/CityPageLayout';

export function generateStaticParams() {
  return cities.map((city) => ({
    city: city.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return {};

  return {
    title: city.metaTitle,
    description: city.metaDescription,
    alternates: {
      canonical: `https://moonenvochtwering.nl/vochtbestrijding/${city.slug}`,
    },
  };
}

export default async function CityPage({ params }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  return <CityPageLayout city={city} />;
}
