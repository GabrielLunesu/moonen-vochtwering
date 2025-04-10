'use client';

import Script from 'next/script';

const LocalBusinessSchema = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': 'Moonen Vochtwering',
    'description': 'Specialist in vochtbestrijding en vochtwering in heel Limburg. Oplossingen voor kelders, muren en schimmelbestrijding.',
    'image': 'https://moonenvochtwering.nl/images/logo.png',
    'url': 'https://moonenvochtwering.nl',
    'telephone': '+31618162515',
    'email': 'info@moonenvochtwering.nl',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Grasbroekerweg 141',
      'addressLocality': 'Heerlen',
      'postalCode': '6412BD',
      'addressCountry': 'NL'
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': '50.8853',
      'longitude': '5.9721'
    },
    'priceRange': '€€',
    'openingHoursSpecification': [
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'opens': '08:00',
        'closes': '17:00'
      }
    ],
    'sameAs': [
      'https://www.facebook.com/moonenvochtwering',
      'https://g.page/r/moonenvochtwering'
    ],
    'areaServed': [
      {
        '@type': 'AdministrativeArea',
        'name': 'Limburg'
      },
      {
        '@type': 'City',
        'name': 'Maastricht'
      },
      {
        '@type': 'City',
        'name': 'Heerlen'
      },
      {
        '@type': 'City',
        'name': 'Venlo'
      },
      {
        '@type': 'City',
        'name': 'Roermond'
      },
      {
        '@type': 'City',
        'name': 'Sittard-Geleen'
      },
      {
        '@type': 'City',
        'name': 'Weert'
      }
    ],
    'serviceArea': {
      '@type': 'GeoCircle',
      'geoMidpoint': {
        '@type': 'GeoCoordinates',
        'latitude': '50.8853',
        'longitude': '5.9721'
      },
      'geoRadius': '50000'
    },
    'hasOfferCatalog': {
      '@type': 'OfferCatalog',
      'name': 'Vochtbestrijding diensten',
      'itemListElement': [
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'Kelderafdichting',
            'description': 'Professionele waterdichting van kelders in heel Limburg'
          }
        },
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'Vochtbestrijding',
            'description': 'Effectieve bestrijding van vocht in muren en kelders'
          }
        },
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'Schimmelbestrijding',
            'description': 'Verwijdering en preventie van schimmel veroorzaakt door vocht'
          }
        },
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'Gevelimpregnatie',
            'description': 'Bescherming van gevels tegen vocht en weersinvloeden'
          }
        }
      ]
    }
  };

  return (
    <Script id="local-business-schema" type="application/ld+json">
      {JSON.stringify(structuredData)}
    </Script>
  );
};

export default LocalBusinessSchema; 