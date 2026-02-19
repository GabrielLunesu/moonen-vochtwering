import Link from 'next/link';

export default function CTASection({
  heading = 'Twijfelt u nog?',
  subheading = 'Een gratis inspectie verplicht u tot niets. Wel krijgt u duidelijkheid over de oorzaak en een eerlijk advies.',
  buttonText = 'Plan een gratis inspectie',
  buttonHref = '/gratis-inspectie',
}) {
  return (
    <section className="bg-[#111827] py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">{heading}</h2>
        <p className="text-[#F9FAFB]/70 text-lg mb-8 max-w-xl mx-auto">{subheading}</p>
        <Link
          href={buttonHref}
          className="inline-block bg-[#8aab4c] hover:bg-[#769B3D] text-white px-8 py-4 rounded-md text-lg font-semibold transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
