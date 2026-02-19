const indicators = [
  { label: '15+ jaar ervaring in Zuid-Limburg', icon: '✓' },
  { label: 'Eerlijk advies, ook als het minder kost', icon: '✓' },
  { label: 'Tot 10 jaar garantie op ons werk', icon: '✓' },
  { label: 'Gratis inspectie zonder verplichtingen', icon: '✓' },
];

export default function WhyMoonen() {
  return (
    <section className="bg-[#F9FAFB] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-[#111827] mb-6">
              Waarom huiseigenaren kiezen voor Moonen
            </h2>
            <p className="text-[#6B7280] text-lg leading-relaxed mb-4">
              Wij zijn geen groot, anoniem bedrijf. Moonen Vochtwering is een familiebedrijf uit Heerlen
              dat al meer dan 15 jaar vochtproblemen oplost in heel Zuid-Limburg.
            </p>
            <p className="text-[#6B7280] text-lg leading-relaxed mb-8">
              Onze kracht? Wij geven eerlijk advies. Soms is de oplossing simpeler en goedkoper dan u denkt.
              En als het complex is, hebben wij de kennis en ervaring om het goed te doen. De eerste keer.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {indicators.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#8aab4c] text-white flex items-center justify-center text-sm shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <span className="text-[#111827] text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <img
              src="/images/owner-moonen.jpeg"
              alt="Het team van Moonen Vochtwering aan het werk"
              className="rounded-xl shadow-lg w-full object-cover"
            />
            <div className="absolute -bottom-4 -left-4 bg-[#8aab4c] text-white px-6 py-3 rounded-lg shadow-lg">
              <p className="text-2xl font-bold font-serif">1000+</p>
              <p className="text-sm opacity-90">tevreden klanten</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
