import Link from 'next/link';

const services = [
  {
    title: 'Kelderafdichting',
    description: 'Uw kelder structureel waterdicht maken met professionele injectie- en coatingtechnieken.',
    href: '/diensten/kelderafdichting',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: 'Opstijgend vocht',
    description: 'Muurinjectie stopt opstijgend vocht permanent. Uw muren worden weer droog en gezond.',
    href: '/diensten/opstijgend-vocht',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
  },
  {
    title: 'Schimmelbestrijding',
    description: 'Professionele schimmelverwijdering met aandacht voor de bron. Voor een gezond binnenklimaat.',
    href: '/diensten/schimmelbestrijding',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: 'Gevelimpregnatie',
    description: 'Bescherm uw gevel tegen vocht, algen en vorstschade. Onzichtbaar maar effectief.',
    href: '/diensten/gevelimpregnatie',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function ServicesOverview() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl md:text-4xl text-[#111827] mb-3">
            Onze oplossingen
          </h2>
          <p className="text-[#6B7280] text-lg max-w-2xl mx-auto">
            Voor elk vochtprobleem de juiste aanpak. Altijd op maat, altijd met garantie.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-[#8aab4c]/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-[#8aab4c] mb-4 group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-[#111827] text-lg font-semibold mb-2">{service.title}</h3>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-4">{service.description}</p>
              <span className="text-[#8aab4c] text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Meer informatie
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
