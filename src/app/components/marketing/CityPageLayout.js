import Link from 'next/link';
import CTASection from './CTASection';

const getServiceCards = (citySlug) => [
  { title: 'Kelderafdichting', href: `/vochtbestrijding/${citySlug}/kelderafdichting`, desc: 'Uw kelder structureel waterdicht maken' },
  { title: 'Opstijgend vocht', href: `/vochtbestrijding/${citySlug}/opstijgend-vocht`, desc: 'Muurinjectie tegen opstijgend vocht' },
  { title: 'Schimmelbestrijding', href: `/vochtbestrijding/${citySlug}/schimmelbestrijding`, desc: 'Professionele schimmelverwijdering' },
  { title: 'Gevelimpregnatie', href: `/vochtbestrijding/${citySlug}/gevelimpregnatie`, desc: 'Gevel beschermen tegen vocht' },
  { title: 'Vochtwerend stucwerk', href: `/vochtbestrijding/${citySlug}/vochtwerend-stucwerk`, desc: 'Vochtbestendige afwerking' },
  { title: 'Gratis inspectie', href: '/gratis-inspectie', desc: 'Gratis vochtmeting aan huis' },
];

export default function CityPageLayout({ city }) {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#111827] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-6">
              Vochtbestrijding in {city.name}
            </h1>
            <p className="text-[#F9FAFB]/70 text-lg leading-relaxed mb-8">
              {city.description}
            </p>
            <Link
              href="/gratis-inspectie"
              className="inline-flex items-center justify-center bg-[#8aab4c] hover:bg-[#769B3D] text-white px-8 py-4 rounded-md text-lg font-semibold transition-all hover:-translate-y-0.5 shadow-lg"
            >
              Plan een gratis inspectie in {city.name}
            </Link>
          </div>
        </div>
      </section>

      {/* Local problems */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl text-[#111827] mb-3 text-center">
              Herkenbare problemen in {city.name}
            </h2>
            {city.housingTypes && (
              <p className="text-[#6B7280] text-center mb-10">
                {city.housingTypes}
              </p>
            )}
            <div className="space-y-4">
              {city.problems.map((problem, i) => (
                <div key={i} className="flex items-start gap-4 bg-[#F9FAFB] rounded-lg p-5">
                  <div className="w-6 h-6 rounded-full bg-[#8aab4c]/10 text-[#8aab4c] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <span className="text-[#111827]">{problem}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Experience + Testimonial */}
      <section className="bg-[#F9FAFB] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl text-[#111827] mb-8">
              Onze ervaring in {city.name}
            </h2>
            {city.testimonial && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="text-4xl text-[#8aab4c] font-serif mb-4">&ldquo;</div>
                <blockquote className="text-lg text-[#111827] italic font-serif leading-relaxed mb-6">
                  {city.testimonial.text}
                </blockquote>
                <p className="font-semibold text-[#111827]">{city.testimonial.author}</p>
                <p className="text-sm text-[#6B7280]">{city.testimonial.project}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl text-[#111827] mb-3 text-center">
            Onze diensten in {city.name}
          </h2>
          <p className="text-[#6B7280] text-center mb-10 max-w-2xl mx-auto">
            Wij bieden alle vochtoplossingen aan in {city.name} en omgeving.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {getServiceCards(city.slug).map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-[#8aab4c]/30 hover:shadow-lg transition-all"
              >
                <h3 className="text-[#111827] text-lg font-semibold mb-2 group-hover:text-[#8aab4c] transition-colors">
                  {card.title}
                </h3>
                <p className="text-[#6B7280] text-sm mb-3">{card.desc} in {city.name}</p>
                <span className="text-[#8aab4c] text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Meer info
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        heading={`Klaar om uw vochtprobleem in ${city.name} op te lossen?`}
        subheading={`Plan een gratis, vrijblijvende inspectie in ${city.name}. Wij komen bij u thuis.`}
        buttonText={`Gratis inspectie in ${city.name}`}
      />
    </>
  );
}
