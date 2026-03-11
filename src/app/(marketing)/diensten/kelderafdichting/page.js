import { getServiceBySlug } from '@/lib/data/services';
import ServicePageLayout from '@/app/components/marketing/ServicePageLayout';

const service = getServiceBySlug('kelderafdichting');

export const metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
  alternates: {
    canonical: '/diensten/kelderafdichting',
  },
};

export default function KelderafdichtingPage() {
  return <ServicePageLayout service={service} />;
}
