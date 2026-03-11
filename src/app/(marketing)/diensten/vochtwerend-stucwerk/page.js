import { getServiceBySlug } from '@/lib/data/services';
import ServicePageLayout from '@/app/components/marketing/ServicePageLayout';

const service = getServiceBySlug('vochtwerend-stucwerk');

export const metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
  alternates: {
    canonical: '/diensten/vochtwerend-stucwerk',
  },
};

export default function VochtwoerendStucwerkPage() {
  return <ServicePageLayout service={service} />;
}
