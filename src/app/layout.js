import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/app/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL('https://moonenvochtwering.nl'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/images/logo.png', type: 'image/png' },
    ],
  },
  other: {
    'theme-color': '#ffffff',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl" className="scroll-smooth">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="https://unpkg.com/react-scan/dist/auto.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}

        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/images/logo.png" type="image/png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
