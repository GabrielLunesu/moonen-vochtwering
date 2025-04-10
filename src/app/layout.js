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
  title: "Vochtbestrijding Heerlen & Parkstad | Moonen Vochtwering Specialist",
  description: "Specialist in vochtbestrijding en vochtwering in Heerlen, Kerkrade, Landgraaf, Brunssum en heel Parkstad. Kelder waterdicht maken, schimmelbestrijding en meer. ✓ 15+ jaar ervaring ✓ Gratis inspectie",
  keywords: "vochtbestrijding heerlen, vochtwering parkstad, vochtproblemen kelder, kelder waterdicht maken, vochtbestrijding kerkrade, schimmelbestrijding heerlen, vochtwering brunssum, vocht kelder, kelderafdichting, injecteren vocht",
  authors: [{ name: "Moonen Vochtwering" }],
  creator: "Moonen Vochtwering",
  publisher: "Moonen Vochtwering",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Vochtbestrijding Heerlen & Parkstad | Moonen Vochtwering",
    description: "Professionele vochtbestrijding in Heerlen, Kerkrade, Landgraaf, Brunssum en omgeving Parkstad. Kelder waterdicht maken, schimmelbestrijding en vochtproblemen oplossen met 15+ jaar ervaring.",
    url: "https://moonenvochtwering.nl",
    siteName: "Moonen Vochtwering",
    locale: "nl_NL",
    type: "website",
    images: [
      {
        url: '/images/logo.png',
        width: 800,
        height: 600,
        alt: 'Moonen Vochtwering - Vochtbestrijding specialist in Heerlen en Parkstad',
      }
    ],
  },
  icons: {
    icon: [
      { url: '/images/logo.png' },
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
        <link rel="icon" href="/images/logo.png" type="image/png" />
        <meta name="google-site-verification" content="your-verification-code" />
        
        <Script async src="https://www.googletagmanager.com/gtag/js?id=AW-16996721083" />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-16996721083');
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
