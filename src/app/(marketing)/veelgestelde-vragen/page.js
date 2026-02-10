import FAQAccordion from '@/app/components/marketing/FAQAccordion';
import CTASection from '@/app/components/marketing/CTASection';
import Script from 'next/script';

export const metadata = {
  title: 'Veelgestelde vragen',
  description:
    'Antwoorden op veelgestelde vragen over vochtbestrijding, kosten, inspectie, schimmel en meer. Moonen Vochtwering geeft duidelijke antwoorden.',
};

const faqGroups = [
  {
    title: 'Over de inspectie',
    items: [
      {
        question: 'Is de inspectie echt gratis?',
        answer:
          'Ja, de inspectie is volledig gratis en vrijblijvend. Wij komen bij u thuis, voeren een vochtmeting uit en geven eerlijk advies. U bent nergens aan gebonden.',
      },
      {
        question: 'Hoe snel kunnen jullie langskomen?',
        answer:
          'In de meeste gevallen kunnen wij binnen een week bij u langskomen. We plannen de afspraak op een moment dat u uitkomt, ook in de avonduren is mogelijk.',
      },
      {
        question: 'Wat gebeurt er tijdens de inspectie?',
        answer:
          'Onze specialist meet het vochtgehalte in muren en vloeren, bekijkt de constructie en onderzoekt de oorzaak van het probleem. U krijgt ter plekke een eerste inschatting en advies.',
      },
      {
        question: 'Moet ik iets voorbereiden voor de inspectie?',
        answer:
          'Nee, u hoeft niets voor te bereiden. Zorg er alleen voor dat de ruimte met het vochtprobleem toegankelijk is. Onze specialist neemt alle benodigde meetapparatuur mee.',
      },
    ],
  },
  {
    title: 'Over kosten',
    items: [
      {
        question: 'Wat kost vochtbestrijding gemiddeld?',
        answer:
          'De kosten zijn sterk afhankelijk van het type probleem, de omvang en de gekozen oplossing. Na de gratis inspectie ontvangt u een heldere offerte met een vaste prijs. Geen verborgen kosten of verrassingen achteraf.',
      },
      {
        question: 'Moet ik een aanbetaling doen?',
        answer:
          'Wij werken niet met aanbetalingen. U betaalt pas na oplevering van het werk, wanneer u tevreden bent met het resultaat.',
      },
      {
        question: 'Kan ik de kosten in termijnen betalen?',
        answer:
          'Bij grotere projecten is betaling in termijnen bespreekbaar. We bespreken dit graag tijdens het offertetraject, zodat we samen tot een passende regeling komen.',
      },
    ],
  },
  {
    title: 'Over het werk',
    items: [
      {
        question: 'Hoe lang duurt een behandeling?',
        answer:
          'Dit verschilt per project. Een muurinjectie duurt meestal 1-2 dagen, een kelderafdichting 3-5 dagen. Grotere projecten kunnen langer duren. We informeren u vooraf over de verwachte doorlooptijd.',
      },
      {
        question: 'Kan ik in huis blijven wonen tijdens de werkzaamheden?',
        answer:
          'Ja, in de meeste gevallen kunt u gewoon in de woning blijven. De overlast is beperkt. Bij grootschalige werkzaamheden bespreken we dit vooraf met u.',
      },
      {
        question: 'Welke garantie krijg ik?',
        answer:
          'Op al onze behandelingen geven wij garantie. De exacte termijn hangt af van de toegepaste methode en wordt vooraf met u besproken. U ontvangt een garantiecertificaat bij oplevering.',
      },
      {
        question: 'Ruimen jullie de rommel op na het werk?',
        answer:
          'Uiteraard. Wij werken netjes en ruimen na afloop alles op. U hoeft zich daar geen zorgen over te maken.',
      },
    ],
  },
  {
    title: 'Over vocht en schimmel',
    items: [
      {
        question: 'Hoe herken ik een vochtprobleem?',
        answer:
          'Veelvoorkomende signalen zijn: vochtvlekken op muren of plafonds, muffe geur, loslatende verf of behang, witte uitslag (salpeter) op muren, schimmelgroei, condensatie op ramen of een klamme sfeer in huis.',
      },
      {
        question: 'Is schimmel gevaarlijk?',
        answer:
          'Ja, schimmel kan gezondheidsklachten veroorzaken zoals luchtwegproblemen, allergieen, hoofdpijn en vermoeidheid. Vooral kinderen, ouderen en mensen met een verminderde weerstand lopen risico.',
      },
      {
        question: 'Kan ik vocht zelf oplossen?',
        answer:
          'Kleine problemen zoals condensatie kunt u soms zelf verbeteren door beter te ventileren. Maar bij structureel vocht, opstijgend vocht of lekkage is professionele hulp nodig. Verkeerde aanpak kan het probleem verergeren.',
      },
      {
        question: 'Komt vocht altijd terug na behandeling?',
        answer:
          'Niet als de oorzaak correct is vastgesteld en de juiste behandeling is toegepast. Wij pakken altijd de bron aan, niet alleen de symptomen. Daarom geven we ook garantie op ons werk.',
      },
    ],
  },
];

// Flatten all Q&A for schema
const allFaqItems = faqGroups.flatMap((g) => g.items);

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: allFaqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export default function VeelgesteldeVragenPage() {
  return (
    <main>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="bg-[#111827] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-6">
              Veelgestelde vragen
            </h1>
            <p className="text-[#F9FAFB]/70 text-lg leading-relaxed">
              Hier vindt u antwoorden op de meest gestelde vragen over vochtbestrijding, onze werkwijze en kosten.
              Staat uw vraag er niet bij? Neem gerust contact op.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FAQAccordion grouped groups={faqGroups} />
        </div>
      </section>

      <CTASection
        heading="Nog vragen?"
        subheading="Bel ons op 06 18 16 25 15 of plan een gratis inspectie. Wij geven u persoonlijk antwoord."
        buttonText="Gratis inspectie aanvragen"
      />
    </main>
  );
}
