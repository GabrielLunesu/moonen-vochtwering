import InspectionForm from '@/app/components/marketing/InspectionForm';
import TestimonialBlock from '@/app/components/marketing/TestimonialBlock';

export const metadata = {
  title: 'Gratis Inspectie Aanvragen',
  description:
    'Vraag een gratis vochtinspectie aan. Wij komen binnen een week bij u thuis voor een grondige analyse. Vrijblijvend en zonder kosten.',
};

const steps = [
  {
    number: '1',
    title: 'U vult het formulier in',
    description: 'Geef uw gegevens door en beschrijf kort uw situatie.',
  },
  {
    number: '2',
    title: 'Wij nemen contact op',
    description: 'Binnen 24 uur bellen wij u om een afspraak in te plannen.',
  },
  {
    number: '3',
    title: 'Gratis inspectie aan huis',
    description: 'Onze specialist komt langs voor een grondige vochtmeting en analyse.',
  },
  {
    number: '4',
    title: 'U beslist',
    description: 'U ontvangt een duidelijke offerte. Geen verplichtingen, geen verrassingen.',
  },
];

export default function GratisInspectiePage() {
  return (
    <main>
      {/* Hero + Form */}
      <section className="bg-[#111827] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left - Copy */}
            <div className="pt-4">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-6">
                Gratis inspectie aan huis.{' '}
                <span className="text-[#8aab4c]">Binnen een week.</span>
              </h1>
              <p className="text-[#F9FAFB]/70 text-lg leading-relaxed mb-10">
                Een vochtprobleem begint altijd met een goede diagnose. Onze specialist komt bij u thuis,
                meet het vochtgehalte en geeft eerlijk advies. Volledig gratis en vrijblijvend.
              </p>

              {/* Trust signals */}
              <div className="space-y-4">
                {[
                  'Gratis en vrijblijvend',
                  'Binnen een week bij u aan huis',
                  'Professionele vochtmeting',
                  'Duidelijke uitleg en eerlijk advies',
                  'Geen verkooppraatjes',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#8aab4c] text-white flex items-center justify-center text-xs shrink-0">
                      ✓
                    </div>
                    <span className="text-[#F9FAFB]/80 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Form */}
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-[#111827] mb-6">
                Vraag uw gratis inspectie aan
              </h2>
              <InspectionForm />
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl text-[#111827] mb-3 text-center">
            Wat kunt u verwachten?
          </h2>
          <p className="text-[#6B7280] text-center mb-12 max-w-2xl mx-auto">
            Van aanvraag tot oplossing — zo verloopt het traject.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#8aab4c]/10 text-[#8aab4c] text-xl font-bold font-serif mb-4">
                  {step.number}
                </div>
                <h3 className="text-[#111827] font-semibold mb-2">{step.title}</h3>
                <p className="text-[#6B7280] text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <TestimonialBlock
        quotes={[
          {
            text: 'De inspectie was heel grondig. Er werd duidelijk uitgelegd wat het probleem was en welke opties er waren. Geen druk om meteen te beslissen.',
            author: 'Werkspot-gebruiker',
            city: 'Maastricht',
            project: 'Gratis inspectie',
          },
        ]}
      />
    </main>
  );
}
