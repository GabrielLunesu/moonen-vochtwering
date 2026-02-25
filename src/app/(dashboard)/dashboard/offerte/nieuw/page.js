import { redirect } from 'next/navigation';

export default async function NieuweOffertePage({ searchParams }) {
  const params = await searchParams;
  const leadId = params?.lead;
  redirect(leadId ? `/dashboard/offerte/builder?lead=${leadId}` : '/dashboard/offerte/builder');
}
