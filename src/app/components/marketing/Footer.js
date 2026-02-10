'use client';

import { useState } from 'react';
import Link from 'next/link';

const diensten = [
  { name: 'Kelderafdichting', href: '/diensten/kelderafdichting' },
  { name: 'Opstijgend vocht', href: '/diensten/opstijgend-vocht' },
  { name: 'Schimmelbestrijding', href: '/diensten/schimmelbestrijding' },
  { name: 'Gevelimpregnatie', href: '/diensten/gevelimpregnatie' },
  { name: 'Vochtwerend stucwerk', href: '/diensten/vochtwerend-stucwerk' },
];

const informatie = [
  { name: 'Werkwijze', href: '/werkwijze' },
  { name: 'Over ons', href: '/over-ons' },
  { name: 'Veelgestelde vragen', href: '/veelgestelde-vragen' },
  { name: 'Gratis inspectie', href: '/gratis-inspectie' },
  { name: 'Contact', href: '/gratis-inspectie' },
];

const steden = [
  'Maastricht', 'Heerlen', 'Sittard-Geleen', 'Kerkrade',
  'Valkenburg', 'Meerssen', 'Brunssum', 'Echt-Susteren',
];

export default function Footer() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#111827] text-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Diensten */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Diensten</h3>
            <ul className="space-y-2.5">
              {diensten.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[#F9FAFB]/70 hover:text-[#8aab4c] transition-colors text-sm">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informatie */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Informatie</h3>
            <ul className="space-y-2.5">
              {informatie.map((item) => (
                <li key={item.href + item.name}>
                  <Link href={item.href} className="text-[#F9FAFB]/70 hover:text-[#8aab4c] transition-colors text-sm">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="tel:+31618162515" className="text-[#F9FAFB]/70 hover:text-[#8aab4c] transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#8aab4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  06 18 16 25 15
                </Link>
              </li>
              <li>
                <Link href="mailto:info@moonenvochtwering.nl" className="text-[#F9FAFB]/70 hover:text-[#8aab4c] transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#8aab4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  info@moonenvochtwering.nl
                </Link>
              </li>
              <li className="flex items-start gap-2 text-[#F9FAFB]/70">
                <svg className="w-4 h-4 text-[#8aab4c] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Grasbroekerweg 141, 6412BD Heerlen
              </li>
              <li className="flex items-start gap-2 text-[#F9FAFB]/70">
                <svg className="w-4 h-4 text-[#8aab4c] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Ma - Vr: 08:00 - 17:00
              </li>
            </ul>
          </div>

          {/* Werkgebied */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Werkgebied</h3>
            <ul className="space-y-2.5">
              {steden.map((stad) => (
                <li key={stad}>
                  <Link
                    href={`/vochtbestrijding/${stad.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-[#F9FAFB]/70 hover:text-[#8aab4c] transition-colors text-sm"
                  >
                    {stad}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[#F9FAFB]/50 text-xs">
            &copy; {currentYear} Moonen Vochtwering &middot; KVK 14090765
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="text-[#F9FAFB]/50 hover:text-[#8aab4c] text-xs transition-colors"
            >
              Privacybeleid
            </button>
            <a
              href="/algemene-voorwaarden.pdf"
              download="Algemene Voorwaarden Moonen Vochtwering.pdf"
              className="text-[#F9FAFB]/50 hover:text-[#8aab4c] text-xs transition-colors"
            >
              Algemene voorwaarden
            </a>
          </div>
        </div>
      </div>

      {/* Privacy modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowPrivacyModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto text-[#111827]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Privacybeleid</h2>
                <button onClick={() => setShowPrivacyModal(false)} className="text-gray-400 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="text-sm space-y-4">
                <p><strong>Laatst bijgewerkt: {currentYear}</strong></p>
                <p>Moonen Vochtwering respecteert de privacy van alle gebruikers van haar website en draagt er zorg voor dat de persoonlijke informatie die u ons verschaft vertrouwelijk wordt behandeld.</p>
                <h3 className="text-lg font-semibold mt-4">Verzameling van persoonsgegevens</h3>
                <p>Wanneer u contact met ons opneemt via het contactformulier, vragen wij u om persoonsgegevens te verstrekken. Deze gegevens worden gebruikt om aan uw verzoek te kunnen voldoen.</p>
                <h3 className="text-lg font-semibold mt-4">Gebruik van persoonsgegevens</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Het afhandelen van uw aanvraag of opdracht</li>
                  <li>Het beantwoorden van uw vragen</li>
                  <li>Het verbeteren van onze dienstverlening</li>
                </ul>
                <h3 className="text-lg font-semibold mt-4">Bewaartermijn</h3>
                <p>Wij bewaren uw persoonsgegevens niet langer dan strikt nodig is om de doelen te realiseren waarvoor uw gegevens worden verzameld.</p>
                <h3 className="text-lg font-semibold mt-4">Delen met derden</h3>
                <p>Moonen Vochtwering verkoopt uw gegevens niet aan derden en verstrekt deze uitsluitend indien dit nodig is voor de uitvoering van onze overeenkomst met u of om te voldoen aan een wettelijke verplichting.</p>
                <h3 className="text-lg font-semibold mt-4">Cookies</h3>
                <p>Onze website maakt gebruik van functionele cookies die noodzakelijk zijn voor het functioneren van de website.</p>
                <h3 className="text-lg font-semibold mt-4">Uw rechten</h3>
                <p>U heeft het recht om uw persoonsgegevens in te zien, te corrigeren of te verwijderen.</p>
                <h3 className="text-lg font-semibold mt-4">Contactgegevens</h3>
                <p>Voor vragen over ons privacybeleid kunt u contact met ons opnemen via info@moonenvochtwering.nl.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
