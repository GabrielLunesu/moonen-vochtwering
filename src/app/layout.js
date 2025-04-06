import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Moonen Vochtwering | Specialist in Parkstad",
  description: "Professionele vochtwering oplossingen voor woningen en bedrijven in Heerlen en omgeving Parkstad. Bescherm uw eigendom tegen vocht en schimmel.",
  keywords: "vochtwering, vochtbestrijding, waterdichting, schimmelbestrijding, vocht, kelder, kruipruimte, Heerlen, Parkstad, Limburg",
  authors: [{ name: "Moonen Vochtwering" }],
  creator: "Moonen Vochtwering",
  publisher: "Moonen Vochtwering",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Moonen Vochtwering | Specialist in Parkstad",
    description: "Professionele vochtwering oplossingen voor woningen en bedrijven in Heerlen en omgeving Parkstad. Bescherm uw eigendom tegen vocht en schimmel.",
    url: "https://moonenvochtwering.nl",
    siteName: "Moonen Vochtwering",
    locale: "nl_NL",
    type: "website",
  },
  icons: {
    icon: [
      { url: '/images/logo.png' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl" className="scroll-smooth">
      <head>
        <link rel="icon" href="/images/logo.png" type="image/png" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
