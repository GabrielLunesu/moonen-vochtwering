import Link from 'next/link';

const steps = [
  {
    number: '01',
    title: 'Gratis inspectie',
    description: 'Wij komen bij u thuis voor een grondige vochtmeting en analyse. Binnen een week, op een moment dat u uitkomt.',
  },
  {
    number: '02',
    title: 'Duidelijke offerte',
    description: 'U ontvangt een heldere offerte met een vaste prijs. Geen verrassingen achteraf, geen verborgen kosten.',
  },
  {
    number: '03',
    title: 'Vakkundig uitgevoerd',
    description: 'Ons team voert het werk snel en netjes uit. Met minimale overlast en tot 10 jaar garantie op het resultaat.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl md:text-4xl text-[#111827] mb-3">
            Zo werkt het
          </h2>
          <p className="text-[#6B7280] text-lg max-w-2xl mx-auto">
            Van eerste contact tot droge woning — in drie stappen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-[#8aab4c]/20" />
              )}

              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#8aab4c]/10 text-[#8aab4c] text-2xl font-bold font-serif mb-4 relative z-10">
                {step.number}
              </div>
              <h3 className="text-[#111827] text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-[#6B7280] text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/gratis-inspectie"
            className="inline-flex items-center justify-center bg-[#8aab4c] hover:bg-[#769B3D] text-white px-8 py-4 rounded-md text-lg font-semibold transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md"
          >
            Start met stap 1 — Gratis inspectie
          </Link>
        </div>
      </div>
    </section>
  );
}
