import { getServiceBySlug } from '@/lib/data/services';
import ServicePageLayout from '@/app/components/marketing/ServicePageLayout';

const service = getServiceBySlug('opstijgend-vocht');

export const metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
};

export default function OpstijgendVochtPage() {
  return <ServicePageLayout service={service} />;
}
