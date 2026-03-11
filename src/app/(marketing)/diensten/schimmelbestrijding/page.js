import { getServiceBySlug } from '@/lib/data/services';
import ServicePageLayout from '@/app/components/marketing/ServicePageLayout';

const service = getServiceBySlug('schimmelbestrijding');

export const metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
  alternates: {
    canonical: '/diensten/schimmelbestrijding',
  },
};

export default function SchimmelbestrijdingPage() {
  return <ServicePageLayout service={service} />;
}
