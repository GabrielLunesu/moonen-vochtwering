import { Inter } from "next/font/google";
import "./globals.css";
import LocalBusinessSchema from "./components/new/LocalBusinessSchema";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Vochtbestrijding Limburg | Moonen Vochtwering Specialist",
  description: "Specialist in vochtbestrijding en vochtwering in heel Limburg. Kelder waterdicht maken, schimmelbestrijding en meer in Maastricht, Roermond, Venlo, Sittard en omgeving. ✓ 15+ jaar ervaring ✓ Gratis inspectie",
  keywords: "vochtbestrijding limburg, vochtwering maastricht, vochtproblemen kelder, kelder waterdicht maken, vochtbestrijding roermond, schimmelbestrijding venlo, vochtwering sittard, vocht kelder, kelderafdichting, injecteren vocht",
  authors: [{ name: "Moonen Vochtwering" }],
  creator: "Moonen Vochtwering",
  publisher: "Moonen Vochtwering",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Vochtbestrijding Limburg | Moonen Vochtwering",
    description: "Professionele vochtbestrijding in heel Limburg. Kelder waterdicht maken, schimmelbestrijding en vochtproblemen oplossen in Maastricht, Roermond, Venlo, Sittard en omgeving met 15+ jaar ervaring.",
    url: "https://moonenvochtwering.nl",
    siteName: "Moonen Vochtwering",
    locale: "nl_NL",
    type: "website",
    images: [
      {
        url: '/images/logo.png',
        width: 800,
        height: 600,
        alt: 'Moonen Vochtwering - Vochtbestrijding specialist in Limburg',
      }
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/images/logo.png', type: 'image/png' },
    ],
  },
  alternates: {
    canonical: 'https://moonenvochtwering.nl',
  },
  other: {
    'application-name': 'Moonen Vochtwering',
    'theme-color': '#355b23',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/images/logo.png" type="image/png" />
        <meta name="google-site-verification" content="your-verification-code" />
        
        <Script async src="https://www.googletagmanager.com/gtag/js?id=AW-16996721083" />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-16996721083');
            
            // Event snippet for Submit lead form conversion
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
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <LocalBusinessSchema />
        {children}
      </body>
    </html>
  );
}
