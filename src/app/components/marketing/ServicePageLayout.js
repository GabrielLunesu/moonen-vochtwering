import Link from 'next/link';
import BeforeAfterSlider from './BeforeAfterSlider';
import FAQAccordion from './FAQAccordion';
import CTASection from './CTASection';

export default function ServicePageLayout({ service }) {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#111827] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-6">
                {service.heroHeading}
              </h1>
              <p className="text-[#F9FAFB]/70 text-lg leading-relaxed mb-8">
                {service.heroSub}
              </p>
              <Link
                href="/gratis-inspectie"
                className="inline-flex items-center justify-center bg-[#8aab4c] hover:bg-[#769B3D] text-white px-8 py-4 rounded-md text-lg font-semibold transition-all hover:-translate-y-0.5 shadow-lg"
              >
                Gratis inspectie aanvragen
              </Link>
            </div>
            <div className="hidden lg:block">
              <img
                src={service.heroImage}
                alt={service.title}
                className="rounded-xl shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem recognition */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl text-[#111827] mb-3 text-center">
              Herkent u dit?
            </h2>
            <p className="text-[#6B7280] text-center mb-10">
              Dit zijn de meest voorkomende signalen. Hoe meer u herkent, hoe urgenter het is om te handelen.
            </p>
            <div className="space-y-4">
              {service.problems.map((problem, i) => (
                <div key={i} className="flex items-start gap-4 bg-[#F9FAFB] rounded-lg p-5">
                  <div className="w-6 h-6 rounded-full bg-[#8aab4c]/10 text-[#8aab4c] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[#111827] font-medium">{problem.title}</h3>
                    <p className="text-[#6B7280] text-sm mt-1">{problem.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution steps */}
      <section className="bg-[#F9FAFB] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl text-[#111827] mb-3 text-center">
            Onze aanpak
          </h2>
          <p className="text-[#6B7280] text-center mb-12 max-w-2xl mx-auto">
            Een bewezen proces voor een blijvend droog resultaat.
          </p>
          <div className="max-w-3xl mx-auto space-y-6">
            {service.solutionSteps.map((step, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-[#111827] text-white flex items-center justify-center text-lg font-bold font-serif shrink-0">
                  {i + 1}
                </div>
                <div className="pt-1">
                  <h3 className="text-[#111827] text-lg font-semibold mb-1">{step.title}</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl text-[#111827] mb-8 text-center">
            Het resultaat
          </h2>
          <BeforeAfterSlider />
        </div>
      </section>

      {/* FAQ */}
      {service.faq && service.faq.length > 0 && (
        <section className="bg-[#F9FAFB] py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl text-[#111827] mb-8 text-center">
              Veelgestelde vragen over {service.title.toLowerCase()}
            </h2>
            <FAQAccordion items={service.faq} />
          </div>
        </section>
      )}

      {/* CTA */}
      <CTASection
        heading={`Heeft u last van ${service.title.toLowerCase()}?`}
        subheading="Plan een gratis inspectie en ontdek wat wij voor u kunnen betekenen. Zonder verplichtingen."
      />
    </>
  );
}
