'use client';

import { useState, useCallback, useRef } from 'react';
import SlotCalendar from '@/app/components/public/SlotCalendar';

export default function InspectionWizard() {
  // --- State ---
  const [step, setStep] = useState('contact');
  const [direction, setDirection] = useState('forward');
  const [isVisible, setIsVisible] = useState(true);
  const [chosenPath, setChosenPath] = useState(null);
  const containerRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', type_probleem: '', message: '',
  });
  const [address, setAddress] = useState({
    straat: '', postcode: '', plaatsnaam: '',
  });
  const [errors, setErrors] = useState({});

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);

  // --- Navigation ---
  const goToStep = useCallback((newStep, dir = 'forward') => {
    setDirection(dir);
    setIsVisible(false);
    setTimeout(() => {
      setStep(newStep);
      setErrors({});
      setSubmitError('');
      setIsVisible(true);
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 250);
  }, []);

  // --- Progress ---
  const getProgress = () => {
    if (chosenPath === 'contact') {
      return { contact: 33, choice: 66, success: 100 }[step] || 0;
    }
    return { contact: 20, choice: 40, address: 60, slot: 80, success: 100 }[step] || 0;
  };

  // --- Load slots ---
  const loadSlots = useCallback(() => {
    setSlotsLoading(true);
    fetch('/api/availability/public?limit=60')
      .then(res => res.ok ? res.json() : [])
      .then(data => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, []);

  // --- Validation ---
  const validateContact = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Naam is verplicht';
    if (!formData.email.trim()) e.email = 'E-mail is verplicht';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Ongeldig e-mailadres';
    if (!formData.phone.trim()) e.phone = 'Telefoonnummer is verplicht';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateAddress = () => {
    const e = {};
    if (!address.straat.trim()) e.straat = 'Straat en huisnummer is verplicht';
    if (!address.postcode.trim()) e.postcode = 'Postcode is verplicht';
    if (!address.plaatsnaam.trim()) e.plaatsnaam = 'Plaatsnaam is verplicht';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleContactNext = (e) => {
    e.preventDefault();
    if (!validateContact()) return;
    goToStep('choice');
  };

  const handleChooseContact = async () => {
    setChosenPath('contact');
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode: 'contact_only' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Er is iets misgegaan');
      if (typeof window !== 'undefined' && window.gtag_report_conversion) {
        window.gtag_report_conversion();
      }
      goToStep('success');
    } catch (err) {
      setSubmitError(err.message || 'Er is iets misgegaan. Probeer het later opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChooseBooking = () => {
    setChosenPath('booking');
    loadSlots();
    goToStep('address');
  };

  const handleAddressNext = (e) => {
    e.preventDefault();
    if (!validateAddress()) return;
    goToStep('slot');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlotId) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/customer/book-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...address, slot_id: selectedSlotId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.code === 'SLOT_FULL') {
          setSlots(prev => prev.filter(s => s.id !== selectedSlotId));
          setSelectedSlotId(null);
          setSubmitError('Dit moment is helaas niet meer beschikbaar. Kies een ander moment.');
          setIsSubmitting(false);
          return;
        }
        throw new Error(data.error || 'Er is iets misgegaan');
      }
      const slot = slots.find(s => s.id === selectedSlotId);
      if (slot) {
        setBookingResult({
          date: new Date(`${slot.slot_date}T12:00:00`).toLocaleDateString('nl-NL', {
            weekday: 'long', day: 'numeric', month: 'long',
          }),
          time: slot.slot_time.slice(0, 5),
        });
      }
      if (typeof window !== 'undefined' && window.gtag_report_conversion) {
        window.gtag_report_conversion();
      }
      goToStep('success');
    } catch (err) {
      setSubmitError(err.message || 'Er is iets misgegaan. Probeer het later opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Styling ---
  const inputClasses = (field) =>
    `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8aab4c] transition-all text-[#111827] bg-white ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  const transitionStyle = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateX(0)' : `translateX(${direction === 'forward' ? '20px' : '-20px'})`,
    transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  // --- Step Renderers ---

  const renderContactStep = () => (
    <form onSubmit={handleContactNext} className="space-y-5">
      <div>
        <p className="text-sm text-[#6B7280] mb-5">Vul uw gegevens in en wij helpen u verder.</p>
      </div>

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
        className="w-full bg-[#8aab4c] hover:bg-[#769B3D] text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
      >
        Verder
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </form>
  );

  const renderChoiceStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-[#111827] mb-1">Hoe wilt u verder?</h3>
        <p className="text-sm text-[#6B7280]">Kies de optie die bij u past</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option A: Send message */}
        <button
          type="button"
          onClick={handleChooseContact}
          disabled={isSubmitting}
          className="group relative p-6 rounded-xl border-2 border-gray-200 hover:border-[#8aab4c] bg-white hover:bg-green-50/30 transition-all duration-300 text-left cursor-pointer hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-[#8aab4c]/10 flex items-center justify-center mb-4 transition-colors">
            <svg className="w-6 h-6 text-[#6B7280] group-hover:text-[#8aab4c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h4 className="font-semibold text-[#111827] mb-1">Bericht versturen</h4>
          <p className="text-sm text-[#6B7280]">Wij nemen binnen 24 uur contact met u op</p>
          {isSubmitting && chosenPath === 'contact' && (
            <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
              <svg className="animate-spin w-6 h-6 text-[#8aab4c]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            </div>
          )}
        </button>

        {/* Option B: Book directly (recommended) */}
        <button
          type="button"
          onClick={handleChooseBooking}
          disabled={isSubmitting}
          className="group relative p-6 rounded-xl border-2 border-[#355b23] bg-[#355b23]/[0.02] hover:bg-[#355b23]/[0.06] transition-all duration-300 text-left cursor-pointer hover:shadow-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {/* Badge */}
          <div className="absolute -top-3 right-4 px-3 py-0.5 bg-[#8aab4c] text-white text-xs font-semibold rounded-full shadow-sm">
            Aanbevolen
          </div>

          <div className="w-12 h-12 rounded-full bg-[#355b23]/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#355b23]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
            </svg>
          </div>
          <h4 className="font-semibold text-[#111827] mb-1">Direct inplannen</h4>
          <p className="text-sm text-[#6B7280]">Plan nu uw gratis vochtinspectie</p>
        </button>
      </div>

      {/* Back button */}
      <button
        type="button"
        onClick={() => goToStep('contact', 'back')}
        disabled={isSubmitting}
        className="w-full text-sm text-[#6B7280] hover:text-[#355b23] transition-colors flex items-center justify-center gap-1 py-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Terug
      </button>
    </div>
  );

  const renderAddressStep = () => (
    <form onSubmit={handleAddressNext} className="space-y-5">
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#355b23]/10 mb-3">
          <svg className="w-6 h-6 text-[#355b23]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#111827] mb-1">Waar mogen wij langskomen?</h3>
        <p className="text-sm text-[#6B7280]">Vul uw adres in zodat onze specialist u kan bezoeken</p>
      </div>

      <div>
        <label htmlFor="straat" className="block text-sm font-medium text-[#111827] mb-1.5">Straat + huisnummer *</label>
        <input type="text" id="straat" name="straat" value={address.straat} onChange={handleAddressChange} className={inputClasses('straat')} placeholder="Voorbeeldstraat 1" />
        {errors.straat && <p className="text-red-500 text-xs mt-1">{errors.straat}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="postcode" className="block text-sm font-medium text-[#111827] mb-1.5">Postcode *</label>
          <input type="text" id="postcode" name="postcode" value={address.postcode} onChange={handleAddressChange} className={inputClasses('postcode')} placeholder="1234 AB" />
          {errors.postcode && <p className="text-red-500 text-xs mt-1">{errors.postcode}</p>}
        </div>
        <div>
          <label htmlFor="plaatsnaam" className="block text-sm font-medium text-[#111827] mb-1.5">Plaatsnaam *</label>
          <input type="text" id="plaatsnaam" name="plaatsnaam" value={address.plaatsnaam} onChange={handleAddressChange} className={inputClasses('plaatsnaam')} placeholder="Heerlen" />
          {errors.plaatsnaam && <p className="text-red-500 text-xs mt-1">{errors.plaatsnaam}</p>}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-[#8aab4c] hover:bg-[#769B3D] text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
      >
        Verder
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      <button
        type="button"
        onClick={() => goToStep('choice', 'back')}
        className="w-full text-sm text-[#6B7280] hover:text-[#355b23] transition-colors flex items-center justify-center gap-1 py-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Terug
      </button>
    </form>
  );

  const renderSlotStep = () => (
    <form onSubmit={handleBookingSubmit} className="space-y-5">
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#355b23]/10 mb-3">
          <svg className="w-6 h-6 text-[#355b23]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#111827] mb-1">Kies een moment</h3>
        <p className="text-sm text-[#6B7280]">Selecteer een datum en tijdstip voor uw gratis inspectie</p>
      </div>

      {slotsLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin w-8 h-8 text-[#8aab4c]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium mb-1">Geen momenten beschikbaar</p>
          <p>Er zijn momenteel geen beschikbare momenten online. Bel ons op <a href="tel:+31618162515" className="font-semibold underline">06 18 16 25 15</a>, dan plannen we direct met u in.</p>
        </div>
      ) : (
        <SlotCalendar
          slots={slots}
          selectedSlotId={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
        />
      )}

      <button
        type="submit"
        disabled={!selectedSlotId || isSubmitting || slots.length === 0}
        className="w-full bg-[#355b23] hover:bg-[#2a4a1c] disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            Bevestigen...
          </>
        ) : (
          'Bevestig inspectie'
        )}
      </button>

      <button
        type="button"
        onClick={() => goToStep('address', 'back')}
        disabled={isSubmitting}
        className="w-full text-sm text-[#6B7280] hover:text-[#355b23] transition-colors flex items-center justify-center gap-1 py-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Terug
      </button>
    </form>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-6">
      {/* Animated checkmark */}
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
        <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
          <circle
            cx="40" cy="40" r="36"
            stroke="#355b23" strokeWidth="3" fill="#355b23" fillOpacity="0.08"
            style={{
              transformOrigin: 'center',
              animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}
          />
          <path
            d="M24 41 L35 52 L56 30"
            stroke="#355b23" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"
            style={{
              strokeDasharray: 50,
              strokeDashoffset: 50,
              animation: 'drawCheck 0.4s ease-out 0.3s forwards',
            }}
          />
        </svg>
      </div>

      {chosenPath === 'booking' && bookingResult ? (
        <>
          <h3 className="text-2xl font-bold text-[#111827] mb-2">Bevestigd!</h3>
          <p className="text-[#6B7280] mb-4">
            Uw inspectie is ingepland op
          </p>
          <div className="inline-block bg-[#355b23]/5 border border-[#355b23]/20 rounded-lg px-6 py-3 mb-4">
            <p className="text-lg font-semibold text-[#355b23]">
              {bookingResult.date} om {bookingResult.time}
            </p>
          </div>
          <p className="text-sm text-[#6B7280]">
            U ontvangt een bevestigingsmail op <strong>{formData.email}</strong>
          </p>
        </>
      ) : (
        <>
          <h3 className="text-2xl font-bold text-[#111827] mb-2">Bedankt!</h3>
          <p className="text-[#6B7280] mb-2">
            Wij hebben uw bericht ontvangen en nemen zo snel mogelijk contact met u op.
          </p>
          <p className="text-sm text-[#6B7280]">
            Meestal binnen 24 uur op werkdagen.
          </p>
        </>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-xs text-[#9CA3AF]">
          Vragen? Bel ons op <a href="tel:+31618162515" className="text-[#355b23] font-medium hover:underline">06 18 16 25 15</a>
        </p>
      </div>

      {/* Inline keyframe animations */}
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );

  // --- Main Render ---
  return (
    <div ref={containerRef}>
      {/* Progress bar */}
      {step !== 'success' && (
        <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${getProgress()}%`,
              background: 'linear-gradient(90deg, #355b23, #8aab4c)',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      )}

      {/* Error banner */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-start gap-3" style={{ animation: 'fadeSlideDown 0.3s ease-out' }}>
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">{submitError}</p>
        </div>
      )}

      {/* Step content with transitions */}
      <div style={transitionStyle}>
        {step === 'contact' && renderContactStep()}
        {step === 'choice' && renderChoiceStep()}
        {step === 'address' && renderAddressStep()}
        {step === 'slot' && renderSlotStep()}
        {step === 'success' && renderSuccessStep()}
      </div>

      {/* Global animation styles */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
