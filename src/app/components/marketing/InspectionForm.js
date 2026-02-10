'use client';

import { useState } from 'react';

export default function InspectionForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    straat: '',
    postcode: '',
    plaats: '',
    type_probleem: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Naam is verplicht';
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail is verplicht';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail is ongeldig';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Telefoonnummer is verplicht';
    if (!formData.plaats.trim()) newErrors.plaats = 'Plaats is verplicht';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          plaatsnaam: formData.plaats,
          type_probleem: formData.type_probleem,
          message: `Adres: ${formData.straat}, ${formData.postcode} ${formData.plaats}\n\n${formData.message}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Er is iets misgegaan');

      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', straat: '', postcode: '', plaats: '', type_probleem: '', message: '' });

      if (typeof window !== 'undefined' && window.gtag_report_conversion) {
        window.gtag_report_conversion();
      }

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      setSubmitError(true);
      setErrorMessage(error.message);
      setTimeout(() => setSubmitError(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (field) =>
    `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8aab4c] transition-colors text-[#111827] bg-white ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <div>
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="font-medium">Bedankt! Wij nemen binnen 24 uur contact met u op om een afspraak in te plannen.</p>
        </div>
      )}

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">{errorMessage || 'Er is iets misgegaan. Probeer het later nog eens of bel ons op 06 18 16 25 15.'}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#111827] mb-1.5">Naam *</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputClasses('name')} placeholder="Uw volledige naam" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#111827] mb-1.5">E-mail *</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses('email')} placeholder="uw@email.nl" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-[#111827] mb-1.5">Telefoonnummer *</label>
          <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputClasses('phone')} placeholder="06 1234 5678" />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-1">
            <label htmlFor="straat" className="block text-sm font-medium text-[#111827] mb-1.5">Straat + huisnummer</label>
            <input type="text" id="straat" name="straat" value={formData.straat} onChange={handleChange} className={inputClasses('straat')} placeholder="Straatnaam 1" />
          </div>
          <div>
            <label htmlFor="postcode" className="block text-sm font-medium text-[#111827] mb-1.5">Postcode</label>
            <input type="text" id="postcode" name="postcode" value={formData.postcode} onChange={handleChange} className={inputClasses('postcode')} placeholder="1234 AB" />
          </div>
          <div>
            <label htmlFor="plaats" className="block text-sm font-medium text-[#111827] mb-1.5">Plaats *</label>
            <input type="text" id="plaats" name="plaats" value={formData.plaats} onChange={handleChange} className={inputClasses('plaats')} placeholder="Uw woonplaats" />
            {errors.plaats && <p className="text-red-500 text-xs mt-1">{errors.plaats}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="type_probleem" className="block text-sm font-medium text-[#111827] mb-1.5">Type probleem</label>
          <select id="type_probleem" name="type_probleem" value={formData.type_probleem} onChange={handleChange} className={`${inputClasses('type_probleem')} appearance-none`}>
            <option value="">Selecteer een optie (optioneel)</option>
            <option value="kelderafdichting">Vochtige kelder</option>
            <option value="opstijgend_vocht">Opstijgend vocht / natte muren</option>
            <option value="schimmel">Schimmel</option>
            <option value="gevelimpregnatie">Vochtproblemen gevel</option>
            <option value="stucwerk">Beschadigd stucwerk door vocht</option>
            <option value="anders">Anders / weet ik niet</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-[#111827] mb-1.5">Toelichting (optioneel)</label>
          <textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={3} className={inputClasses('message')} placeholder="Beschrijf kort uw situatie..." />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#8aab4c] hover:bg-[#769B3D] disabled:opacity-50 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-sm hover:shadow-md"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              Verzenden...
            </span>
          ) : (
            'Gratis inspectie aanvragen'
          )}
        </button>

        <p className="text-xs text-[#6B7280] text-center">
          * Verplichte velden. Wij nemen binnen 24 uur contact met u op.
        </p>
      </form>
    </div>
  );
}
