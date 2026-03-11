import { notFound } from 'next/navigation';
import { cityServices, getCityService, getAllCityServiceParams, getSiblingServices, getSameCities } from '@/lib/data/city-services';
import CityServicePageLayout from '@/app/components/marketing/CityServicePageLayout';

export function generateStaticParams() {
  return getAllCityServiceParams();
}

export async function generateMetadata({ params }) {
  const { city, service } = await params;
  const data = getCityService(city, service);
  if (!data) return {};

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: {
      canonical: `https://moonenvochtwering.nl/vochtbestrijding/${data.citySlug}/${data.serviceSlug}`,
    },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `https://moonenvochtwering.nl/vochtbestrijding/${data.citySlug}/${data.serviceSlug}`,
      siteName: 'Moonen Vochtwering',
      locale: 'nl_NL',
      type: 'website',
    },
  };
}

export default async function CityServicePage({ params }) {
  const { city, service } = await params;
  const data = getCityService(city, service);

  if (!data) {
    notFound();
  }

  const siblings = getSiblingServices(city, service);
  const sameCities = getSameCities(city, service);

  return <CityServicePageLayout data={data} siblings={siblings} sameCities={sameCities} />;
}
