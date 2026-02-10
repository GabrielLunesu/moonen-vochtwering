import CTASection from '@/app/components/marketing/CTASection';
import TrustBadges from '@/app/components/marketing/TrustBadges';

export const metadata = {
  title: 'Over ons',
  description:
    'Leer Moonen Vochtwering kennen: een familiebedrijf uit Heerlen met meer dan 15 jaar ervaring in vochtbestrijding in Zuid-Limburg.',
};

const values = [
  {
    title: 'Eerlijk advies',
    description:
      'Wij vertellen u de waarheid, ook als die minder verkoopt. Soms is de oplossing simpeler en goedkoper dan u denkt. Wij adviseren wat nodig is, niet wat het meeste oplevert.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Vakmanschap',
    description:
      'Met meer dan 15 jaar ervaring kennen we elk type vochtprobleem. We werken met bewezen methoden en hoogwaardige materialen. Het resultaat moet niet alleen goed zijn, maar ook blijvend.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    title: 'Garantie',
    description:
      'Wij staan achter ons werk. Op elke behandeling geven wij garantie. Niet omdat het moet, maar omdat we vertrouwen hebben in de kwaliteit van wat we doen.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

export default function OverOnsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#111827] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-6">
                Niet zomaar een bedrijf.{' '}
                <span className="text-[#8aab4c]">Een familiebedrijf.</span>
              </h1>
              <p className="text-[#F9FAFB]/70 text-lg leading-relaxed">
                Moonen Vochtwering is opgericht vanuit een simpel idee: mensen helpen met hun
                vochtprobleem, op een eerlijke en vakkundige manier. Geen verkooppraatjes,
                geen onnodige kosten. Gewoon goed werk.
              </p>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://placehold.co/600x400/0B1120/F9FAFB?text=Familie+Moonen"
                alt="Het team van Moonen Vochtwering"
                className="rounded-xl shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl text-[#111827] mb-6 text-center">Ons verhaal</h2>
          <div className="prose prose-lg mx-auto text-[#6B7280] space-y-4">
            <p>
              Al meer dan 15 jaar helpen wij huiseigenaren in Zuid-Limburg met het oplossen van
              vochtproblemen. Wat begon als een eenmanszaak in Heerlen, is uitgegroeid tot een
              gevestigde naam in de regio.
            </p>
            <p>
              Vanuit ons kantoor aan de Grasbroekerweg in Heerlen bedienen we klanten van Maastricht
              tot Echt-Susteren, van Valkenburg tot Kerkrade. In al die jaren hebben we meer dan 1000
              projecten succesvol afgerond.
            </p>
            <p>
              Wat ons drijft? Het verschil zien bij mensen. Een klant die zijn kelder weer kan gebruiken.
              Een gezin dat weer gezond kan ademen. Een huiseigenaar die niet langer wakker ligt van
              vochtschade. Dat is waar we het voor doen.
            </p>
            <p>
              We geloven in persoonlijk contact, eerlijk advies en vakmanschap. Geen grote beloftes,
              maar concrete resultaten. En als het werk klaar is, staan we er met onze garantie achter.
            </p>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-[#F9FAFB] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBadges />
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl text-[#111827] mb-12 text-center">
            Waar wij voor staan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#8aab4c]/10 text-[#8aab4c] mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#111827] mb-3">{value.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        heading="Wilt u ons leren kennen?"
        subheading="Plan een gratis inspectie en ervaar zelf hoe wij werken. Persoonlijk, eerlijk en vakkundig."
      />
    </main>
  );
}
