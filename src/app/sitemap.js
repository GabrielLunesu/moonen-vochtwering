import { cities } from '@/lib/data/cities';
import { services } from '@/lib/data/services';
import { getAllCityServiceParams } from '@/lib/data/city-services';

const baseUrl = 'https://moonenvochtwering.nl';

export default function sitemap() {
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/gratis-inspectie`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/werkwijze`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/over-ons`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/veelgestelde-vragen`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  const servicePages = services.map((service) => ({
    url: `${baseUrl}/diensten/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const cityPages = cities.map((city) => ({
    url: `${baseUrl}/vochtbestrijding/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const cityServicePages = getAllCityServiceParams().map(({ city, service }) => ({
    url: `${baseUrl}/vochtbestrijding/${city}/${service}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...servicePages, ...cityPages, ...cityServicePages];
}
