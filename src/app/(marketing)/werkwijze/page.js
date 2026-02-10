import CTASection from '@/app/components/marketing/CTASection';

export const metadata = {
  title: 'Werkwijze',
  description:
    'Zo werkt Moonen Vochtwering: van gratis inspectie tot oplevering. Ontdek ons 5-stappen proces voor een blijvend droge woning.',
};

const steps = [
  {
    number: '01',
    title: 'Gratis inspectie aan huis',
    description:
      'Onze specialist komt bij u thuis en voert een grondige vochtmeting uit. We onderzoeken de oorzaak van het probleem en bekijken de constructie van uw woning. Dit is volledig gratis en vrijblijvend.',
    timeIndicator: 'Duurt ca. 45-60 minuten',
    side: 'left',
  },
  {
    number: '02',
    title: 'Diagnose en advies',
    description:
      'Op basis van de inspectie stellen we een diagnose. We leggen u in duidelijke taal uit wat het probleem is, wat de oorzaak is en welke oplossingen er zijn. U ontvangt eerlijk advies — ook als de oplossing simpeler is dan verwacht.',
    timeIndicator: 'Dezelfde dag als de inspectie',
    side: 'right',
  },
  {
    number: '03',
    title: 'Heldere offerte',
    description:
      'Binnen enkele dagen ontvangt u een gedetailleerde offerte. Met een vaste prijs, een duidelijke omschrijving van het werk en de te verwachten doorlooptijd. Geen kleine lettertjes, geen verborgen kosten.',
    timeIndicator: 'Binnen 3 werkdagen',
    side: 'left',
  },
  {
    number: '04',
    title: 'Uitvoering van het werk',
    description:
      'Na uw akkoord plannen we het werk in op een moment dat u uitkomt. Ons team werkt vakkundig, netjes en met minimale overlast. We houden u op de hoogte van de voortgang en zijn bereikbaar voor vragen.',
    timeIndicator: 'Planning in overleg',
    side: 'right',
  },
  {
    number: '05',
    title: 'Oplevering en garantie',
    description:
      'Na afronding controleren we samen het resultaat. U ontvangt een garantiecertificaat en uitleg over eventueel onderhoud. En mocht er ooit iets zijn: we zijn altijd bereikbaar.',
    timeIndicator: 'Tot 10 jaar garantie',
    side: 'left',
  },
];

export default function WerkwijzePage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#111827] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-6">
              Onze werkwijze: <span className="text-[#8aab4c]">duidelijk en eerlijk</span>
            </h1>
            <p className="text-[#F9FAFB]/70 text-lg leading-relaxed">
              Van eerste contact tot oplevering — zo pakken wij het aan. Geen verrassingen, geen verborgen
              kosten. Wel een duidelijk proces en een team dat doet wat het belooft.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Vertical line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-[#8aab4c]/20 -translate-x-1/2" />

            <div className="space-y-16 md:space-y-24">
              {steps.map((step) => (
                <div key={step.number} className="relative">
                  {/* Number circle (centered on line) */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 -top-2 w-16 h-16 rounded-full bg-[#111827] text-white items-center justify-center text-xl font-bold font-serif z-10">
                    {step.number}
                  </div>

                  <div className={`md:grid md:grid-cols-2 md:gap-16 ${step.side === 'right' ? '' : ''}`}>
                    {/* Content */}
                    <div className={`${step.side === 'right' ? 'md:col-start-2' : ''} ${step.side === 'right' ? 'md:pl-12' : 'md:pr-12 md:text-right'}`}>
                      {/* Mobile number */}
                      <div className="md:hidden inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#111827] text-white text-lg font-bold font-serif mb-4">
                        {step.number}
                      </div>

                      <h2 className="text-2xl font-semibold text-[#111827] mb-3">{step.title}</h2>
                      <p className="text-[#6B7280] leading-relaxed mb-3">{step.description}</p>
                      <span className="inline-block text-sm text-[#8aab4c] font-medium bg-[#8aab4c]/10 px-3 py-1 rounded-full">
                        {step.timeIndicator}
                      </span>
                    </div>

                    {/* Step image */}
                    <div className={`hidden md:block ${step.side === 'right' ? 'md:col-start-1 md:row-start-1' : ''}`}>
                      <img
                        src={`/images/steps/step-${step.number.replace('0', '')}.jpeg`}
                        alt={step.title}
                        className="rounded-xl w-full h-64 object-cover"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTASection
        heading="Klaar om te beginnen?"
        subheading="Stap 1 is gratis en verplicht u tot niets. Wij komen bij u thuis voor een grondige analyse."
        buttonText="Plan uw gratis inspectie"
      />
    </main>
  );
}
