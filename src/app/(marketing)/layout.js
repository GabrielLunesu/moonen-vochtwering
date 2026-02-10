import Script from "next/script";
import Navbar from "@/app/components/marketing/Navbar";
import Footer from "@/app/components/marketing/Footer";
import StickyCtaBar from "@/app/components/marketing/StickyCtaBar";

export const metadata = {
  title: {
    default: "Vochtbestrijding Zuid-Limburg | Moonen Vochtwering",
    template: "%s | Moonen Vochtwering",
  },
  description:
    "Specialist in vochtbestrijding en kelderafdichting in Zuid-Limburg. Kelderafdichting, schimmelbestrijding, muurinjectie en meer. 15+ jaar ervaring. Gratis inspectie.",
  keywords:
    "vochtbestrijding zuid-limburg, kelderafdichting, schimmelbestrijding, opstijgend vocht, gevelimpregnatie, vochtwerend stucwerk, moonen vochtwering",
  authors: [{ name: "Moonen Vochtwering" }],
  creator: "Moonen Vochtwering",
  publisher: "Moonen Vochtwering",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Vochtbestrijding Zuid-Limburg | Moonen Vochtwering",
    description:
      "Professionele vochtbestrijding in Zuid-Limburg. Kelderafdichting, schimmelbestrijding en vochtproblemen oplossen met 15+ jaar ervaring.",
    url: "https://moonenvochtwering.nl",
    siteName: "Moonen Vochtwering",
    locale: "nl_NL",
    type: "website",
    images: [
      {
        url: "/images/logo.png",
        width: 800,
        height: 600,
        alt: "Moonen Vochtwering - Vochtbestrijding specialist in Zuid-Limburg",
      },
    ],
  },
  alternates: {
    canonical: "https://moonenvochtwering.nl",
  },
  other: {
    "application-name": "Moonen Vochtwering",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Moonen Vochtwering",
  description:
    "Specialist in vochtbestrijding en kelderafdichting in Zuid-Limburg. Kelderafdichting, schimmelbestrijding, muurinjectie en gevelimpregnatie.",
  image: "https://moonenvochtwering.nl/images/logo.png",
  url: "https://moonenvochtwering.nl",
  telephone: "+31618162515",
  email: "info@moonenvochtwering.nl",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Grasbroekerweg 141",
    addressLocality: "Heerlen",
    postalCode: "6412BD",
    addressCountry: "NL",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "50.8853",
    longitude: "5.9721",
  },
  priceRange: "€€",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "17:00",
    },
  ],
  areaServed: [
    { "@type": "City", name: "Maastricht" },
    { "@type": "City", name: "Heerlen" },
    { "@type": "City", name: "Sittard-Geleen" },
    { "@type": "City", name: "Kerkrade" },
    { "@type": "City", name: "Valkenburg" },
    { "@type": "City", name: "Meerssen" },
    { "@type": "City", name: "Brunssum" },
    { "@type": "City", name: "Echt-Susteren" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Vochtbestrijding diensten",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Kelderafdichting",
          description: "Professionele waterdichting van kelders in Zuid-Limburg",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Opstijgend vocht bestrijding",
          description: "Muurinjectie tegen opstijgend vocht",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Schimmelbestrijding",
          description: "Professionele schimmelverwijdering en preventie",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Gevelimpregnatie",
          description: "Bescherming van gevels tegen vocht en verwering",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Vochtwerend stucwerk",
          description: "Vochtbestendige pleisterafwerking voor muren",
        },
      },
    ],
  },
};

export default function MarketingLayout({ children }) {
  return (
    <>
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=AW-16996721083"
      />
      <Script id="google-ads" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-16996721083');

          function gtag_report_conversion(url) {
            var callback = function () {
              if (typeof(url) != 'undefined') {
                window.location = url;
              }
            };
            gtag('event', 'conversion', {
                'send_to': 'AW-16996721083/RoQTCKiT-bYaELvD1ag_',
                'value': 1.0,
                'currency': 'EUR',
                'event_callback': callback
            });
            return false;
          }
        `}
      </Script>
      <Script
        id="local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Navbar />
      {children}
      <Footer />
      <StickyCtaBar />
    </>
  );
}
