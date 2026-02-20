'use client';

import Link from 'next/link';
import FAQAccordion from './FAQAccordion';
import CTASection from './CTASection';

export default function CityServicePageLayout({ data, siblings, sameCities }) {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: data.faq.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: item.answer,
                },
              })),
            },
            {
              '@context': 'https://schema.org',
              '@type': 'Service',
              name: data.serviceTitle,
              description: data.metaDescription,
              provider: {
                '@type': 'LocalBusiness',
                name: 'Moonen Vochtwering',
                telephone: '+31618162515',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'Grasbroekerweg 141',
                  addressLocality: data.cityName,
                  postalCode: '6412BD',
                  addressRegion: 'Limburg',
                  addressCountry: 'NL',
                },
              },
              areaServed: {
                '@type': 'City',
                name: data.cityName,
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://moonenvochtwering.nl',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: `Vochtbestrijding ${data.cityName}`,
                  item: `https://moonenvochtwering.nl/vochtbestrijding/${data.citySlug}`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: `${data.serviceTitle} ${data.cityName}`,
                  item: `https://moonenvochtwering.nl/vochtbestrijding/${data.citySlug}/${data.serviceSlug}`,
                },
              ],
            },
          ]),
        }}
      />

      {/* 1. Hero — Engage */}
      <section className="bg-[#111827] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <nav className="flex items-center gap-2 text-sm text-[#F9FAFB]/50 mb-8">
              <Link href="/" className="hover:text-[#F9FAFB]/70 transition-colors">Home</Link>
              <span>/</span>
              <Link href={`/vochtbestrijding/${data.citySlug}`} className="hover:text-[#F9FAFB]/70 transition-colors">
                {data.cityName}
              </Link>
              <span>/</span>
              <span className="text-[#F9FAFB]/70">{data.serviceTitle}</span>
            </nav>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-6">
              {data.heroHeading}
            </h1>
            <p className="text-[#F9FAFB]/70 text-lg leading-relaxed mb-8">
              {data.heroSub}
            </p>
            <Link
              href="/gratis-inspectie"
              className="inline-flex items-center justify-center bg-[#8aab4c] hover:bg-[#769B3D] text-white px-8 py-4 rounded-md text-lg font-semibold transition-all hover:-translate-y-0.5 shadow-lg"
            >
              Gratis inspectie in {data.cityName}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Local Problems — Educate */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl text-[#111827] mb-3 text-center">
              {data.localProblemHeading}
            </h2>
            <p className="text-[#6B7280] text-center mb-10">
              {data.localProblemIntro}
            </p>
            <div className="space-y-4">
              {data.localProblems.map((problem, i) => (
                <div key={i} className="flex items-start gap-4 bg-[#F9FAFB] rounded-lg p-5">
                  <div className="w-6 h-6 rounded-full bg-[#8aab4c]/10 text-[#8aab4c] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#111827] mb-1">{problem.title}</h3>
                    <p className="text-[#6B7280] text-sm">{problem.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Solution Approach — Educate */}
      <section className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl text-[#111827] mb-6 text-center">
              Onze aanpak in {data.cityName}
            </h2>
            <p className="text-[#6B7280] leading-relaxed text-center">
              {data.educateText}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Transformation — Excite */}
      <section className="bg-[#F9FAFB] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-serif text-3xl text-[#111827] mb-4">
              {data.exciteHeading}
            </h2>
            <p className="text-[#6B7280] leading-relaxed">
              {data.exciteText}
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              {data.solutionSteps.map((step) => (
                <div key={step.step} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#8aab4c] text-white flex items-center justify-center font-bold shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#111827] mb-1">{step.title}</h3>
                    <p className="text-[#6B7280] text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Evidence */}
      <section className="bg-[#0B1120] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Trust stats */}
            <div className="grid grid-cols-3 gap-8 mb-12">
              <div>
                <div className="text-3xl font-bold text-[#8aab4c]">15+</div>
                <div className="text-sm text-[#F9FAFB]/60 mt-1">Jaar ervaring</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#8aab4c]">1000+</div>
                <div className="text-sm text-[#F9FAFB]/60 mt-1">Tevreden klanten</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#8aab4c]">100%</div>
                <div className="text-sm text-[#F9FAFB]/60 mt-1">Garantie</div>
              </div>
            </div>
            {/* Testimonial */}
            {data.testimonial && (
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <div className="text-4xl text-[#8aab4c] font-serif mb-4">&ldquo;</div>
                <blockquote className="text-lg text-[#F9FAFB]/90 italic font-serif leading-relaxed mb-6">
                  {data.testimonial.text}
                </blockquote>
                <p className="font-semibold text-white">{data.testimonial.author}</p>
                <p className="text-sm text-[#F9FAFB]/50">{data.testimonial.city} &mdash; {data.testimonial.project}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. FAQ — Empower */}
      <section className="bg-[#F9FAFB] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl text-[#111827] mb-8 text-center">
              Veelgestelde vragen over {data.serviceTitle.toLowerCase()} in {data.cityName}
            </h2>
            <FAQAccordion items={data.faq} />
          </div>
        </div>
      </section>

      {/* 7. CTA — Empower */}
      <CTASection
        heading={data.ctaHeading}
        subheading={data.ctaSub}
        buttonText={data.ctaButtonText}
      />

      {/* 8. Internal Links */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Other services in this city */}
            {siblings.length > 0 && (
              <div className="mb-10">
                <h3 className="font-serif text-xl text-[#111827] mb-4">
                  Andere diensten in {data.cityName}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {siblings.map((s) => (
                    <Link
                      key={s.serviceSlug}
                      href={`/vochtbestrijding/${data.citySlug}/${s.serviceSlug}`}
                      className="text-sm bg-[#F9FAFB] hover:bg-[#8aab4c]/10 text-[#111827] hover:text-[#8aab4c] px-4 py-2 rounded-full border border-gray-200 hover:border-[#8aab4c]/30 transition-all"
                    >
                      {s.serviceTitle} in {data.cityName}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {/* Same service in other cities */}
            {sameCities.length > 0 && (
              <div>
                <h3 className="font-serif text-xl text-[#111827] mb-4">
                  {data.serviceTitle} in andere steden
                </h3>
                <div className="flex flex-wrap gap-3">
                  {sameCities.map((s) => (
                    <Link
                      key={s.citySlug}
                      href={`/vochtbestrijding/${s.citySlug}/${data.serviceSlug}`}
                      className="text-sm bg-[#F9FAFB] hover:bg-[#8aab4c]/10 text-[#111827] hover:text-[#8aab4c] px-4 py-2 rounded-full border border-gray-200 hover:border-[#8aab4c]/30 transition-all"
                    >
                      {data.serviceTitle} in {s.cityName}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
