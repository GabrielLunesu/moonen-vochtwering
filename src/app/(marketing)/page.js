import Hero from '@/app/components/marketing/Hero';
import ProblemAgitation from '@/app/components/marketing/ProblemAgitation';
import BeforeAfterSlider from '@/app/components/marketing/BeforeAfterSlider';
import WhyMoonen from '@/app/components/marketing/WhyMoonen';
import ServicesOverview from '@/app/components/marketing/ServicesOverview';
import TestimonialBlock from '@/app/components/marketing/TestimonialBlock';
import HowItWorks from '@/app/components/marketing/HowItWorks';
import ServiceArea from '@/app/components/marketing/ServiceArea';
import CTASection from '@/app/components/marketing/CTASection';

export default function Home() {
  return (
    <main>
      <Hero />
      <ProblemAgitation />

      {/* Before/After showcase */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl md:text-4xl text-[#111827] mb-3 text-center">
            Van vochtprobleem naar droge kelder
          </h2>
          <p className="text-[#6B7280] text-center mb-10 max-w-xl mx-auto">
            Sleep de lijn om het verschil te zien. Dit is wat wij voor u kunnen betekenen.
          </p>
          <BeforeAfterSlider />
        </div>
      </section>

      <WhyMoonen />
      <ServicesOverview />

      <TestimonialBlock
        quotes={[
          {
            text: 'Komt afspraken na, denkt mee, is eerlijk en geeft goede adviezen. Zeker aan te raden!',
            author: 'Werkspot-gebruiker',
            city: 'Maastricht',
            project: 'Vochtbestrijding',
          },
          {
            text: 'Het werk is perfect afgeleverd, graag beveel ik deze vakman bij iedereen aan.',
            author: 'Wim Prins',
            city: '',
            project: 'Gevels impregneren',
          },
          {
            text: 'Zeer goed. Mensen komen afspraken na, werken hard, keurig en zijn heel vriendelijk. Ik kan dit bedrijf bij iedereen aanraden.',
            author: 'Annette',
            city: 'Meerssen',
            project: 'Vochtbestrijding',
          },
          {
            text: 'Hij heeft zich echt verdiept in de klus, kwam al zijn afspraken na en is bovendien een aardige en spontane man.',
            author: 'Jo Smeets',
            city: '',
            project: 'Kelder waterdicht maken',
          },
        ]}
      />

      <HowItWorks />
      <ServiceArea />

      <CTASection
        heading="Twijfelt u nog?"
        subheading="Een gratis inspectie verplicht u tot niets. Wel krijgt u duidelijkheid over de oorzaak en een eerlijk advies."
        buttonText="Plan een gratis inspectie"
      />
    </main>
  );
}
