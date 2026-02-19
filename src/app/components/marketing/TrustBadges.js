const badges = [
  { number: '15+', label: 'Jaar ervaring' },
  { number: '1000+', label: 'Projecten voltooid' },
  { number: '10', label: 'Jaar garantie' },
  { number: '100%', label: 'Gratis inspectie' },
];

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
      {badges.map((badge) => (
        <div key={badge.label} className="text-center">
          <div className="text-[#8aab4c] text-3xl md:text-4xl font-bold font-serif mb-1">
            {badge.number}
          </div>
          <div className="text-[#6B7280] text-sm">{badge.label}</div>
        </div>
      ))}
    </div>
  );
}
