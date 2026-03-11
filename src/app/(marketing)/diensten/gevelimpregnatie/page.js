import { getServiceBySlug } from '@/lib/data/services';
import ServicePageLayout from '@/app/components/marketing/ServicePageLayout';

const service = getServiceBySlug('gevelimpregnatie');

export const metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
  alternates: {
    canonical: '/diensten/gevelimpregnatie',
  },
};

export default function GevelimpregnatiePage() {
  return <ServicePageLayout service={service} />;
}
