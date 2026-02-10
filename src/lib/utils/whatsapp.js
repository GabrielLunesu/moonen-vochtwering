export function createWhatsAppLink(phone, message) {
  const cleanPhone = phone.replace(/\D/g, "");
  // Add country code if starting with 06
  const fullPhone = cleanPhone.startsWith("06")
    ? "31" + cleanPhone.slice(1)
    : cleanPhone.startsWith("316")
    ? cleanPhone
    : "31" + cleanPhone;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encoded}`;
}

export function createRouteMessage(leads, dayLabel = "voor vandaag") {
  const addresses = leads
    .map((lead, i) => {
      const timePrefix = lead.inspection_time ? `${lead.inspection_time} - ` : "";
      return `${i + 1}. ${timePrefix}${lead.name} - ${lead.plaatsnaam}`;
    })
    .join("\n");

  return `Route ${dayLabel}:\n\n${addresses}`;
}
