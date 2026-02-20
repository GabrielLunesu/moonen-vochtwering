import { notFound } from 'next/navigation';
import { cityServices, getCityService, getAllCityServiceParams, getSiblingServices, getSameCities } from '@/lib/data/city-services';
import CityServicePageLayout from '@/app/components/marketing/CityServicePageLayout';

export function generateStaticParams() {
  return getAllCityServiceParams();
}

export function generateMetadata({ params }) {
  const data = getCityService(params.city, params.service);
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

export default function CityServicePage({ params }) {
  const data = getCityService(params.city, params.service);

  if (!data) {
    notFound();
  }

  const siblings = getSiblingServices(params.city, params.service);
  const sameCities = getSameCities(params.city, params.service);

  return <CityServicePageLayout data={data} siblings={siblings} sameCities={sameCities} />;
}
