const problems = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Uw woningwaarde daalt',
    description: 'Een vochtig huis verliest tot 15% van zijn marktwaarde. Kopers haken af bij zichtbare vochtsporen, en makelaars waarschuwen voor verborgen gebreken.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: 'Uw gezondheid lijdt',
    description: 'Schimmelsporen veroorzaken luchtwegklachten, allergieen en vermoeidheid. Vooral kinderen en ouderen zijn kwetsbaar. U ademt het elke dag in.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    title: 'Het wordt alleen maar erger',
    description: 'Vocht stopt niet vanzelf. Elke maand zonder actie betekent meer schade aan muren, vloeren en fundering. En hogere herstelkosten.',
  },
];

export default function ProblemAgitation() {
  return (
    <section className="bg-[#0B1120] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-3">
            Waarom u niet kunt wachten
          </h2>
          <p className="text-[#F9FAFB]/60 text-lg max-w-2xl mx-auto">
            Vochtproblemen zijn meer dan een cosmetisch probleem. Ze raken uw portemonnee, uw gezondheid en uw gemoedsrust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem) => (
            <div key={problem.title} className="bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-colors">
              <div className="text-[#8aab4c] mb-4">{problem.icon}</div>
              <h3 className="text-white text-xl font-semibold mb-3">{problem.title}</h3>
              <p className="text-[#F9FAFB]/60 text-sm leading-relaxed">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
