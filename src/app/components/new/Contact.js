'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    plaatsnaam: '',
    type_probleem: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const headingRef = useRef(null);
  const formRef = useRef(null);
  const infoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Store refs in variables to use in cleanup
    const headingElement = headingRef.current;
    const formElement = formRef.current;
    const infoElement = infoRef.current;

    if (headingElement) observer.observe(headingElement);
    if (formElement) observer.observe(formElement);
    if (infoElement) observer.observe(infoElement);

    return () => {
      if (headingElement) observer.unobserve(headingElement);
      if (formElement) observer.unobserve(formElement);
      if (infoElement) observer.unobserve(infoElement);
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Naam is verplicht';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail is verplicht';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail is ongeldig';
    }

    if (!formData.plaatsnaam.trim()) {
      newErrors.plaatsnaam = 'Plaatsnaam is verplicht';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefoonnummer is verplicht';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Bericht is verplicht';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan bij het verzenden van uw bericht');
      }

      // Success
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        plaatsnaam: '',
        type_probleem: '',
        message: ''
      });

      // Scroll to form top to show success message
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
      }

      // Track form conversion for Google Ads
      if (typeof window !== 'undefined' && window.gtag_report_conversion) {
        window.gtag_report_conversion();
      }

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      setSubmitError(true);
      setErrorMessage(error.message);

      // Reset error message after 5 seconds
      setTimeout(() => {
        setSubmitError(false);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section bg-gray-100">
      <div className="container-narrow">
        <div ref={headingRef} className="text-center mb-8 md:mb-16 opacity-0">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-black">Contact</h2>
          <div className="divider mx-auto"></div>
          <p className="text-black max-w-2xl mx-auto">
            Heeft u vragen of wilt u een offerte aanvragen? Neem contact met ons op.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          <div ref={formRef} className="w-full lg:w-2/3 opacity-0">
            <div className="card p-4 md:p-8">
              {submitSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6 animate-fade-in">
                  <div className="flex">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="font-medium">Bedankt voor uw bericht! We nemen zo spoedig mogelijk contact met u op.</p>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 animate-fade-in">
                  <div className="flex">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="font-medium">{errorMessage || 'Er is iets misgegaan. Probeer het later nog eens of neem telefonisch contact met ons op.'}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                  <div>
                    <label htmlFor="name" className="block text-black font-medium mb-2 text-sm md:text-base">Naam *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-black ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      placeholder="Uw naam"
                    />
                    {errors.name && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-black font-medium mb-2 text-sm md:text-base">E-mail *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-black ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      placeholder="uw@email.nl"
                    />
                    {errors.email && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="mb-4 md:mb-6">
                  <label htmlFor="plaatsnaam" className="block text-black font-medium mb-2 text-sm md:text-base">Plaatsnaam *</label>
                  <input
                    type="text"
                    id="plaatsnaam"
                    name="plaatsnaam"
                    value={formData.plaatsnaam}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-black ${errors.plaatsnaam ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Uw plaatsnaam"
                  />
                  {errors.plaatsnaam && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.plaatsnaam}</p>}
                </div>

                <div className="mb-4 md:mb-6">
                  <label htmlFor="phone" className="block text-black font-medium mb-2 text-sm md:text-base">Telefoonnummer *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-black ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Uw telefoonnummer"
                  />
                  {errors.phone && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.phone}</p>}
                </div>

                <div className="mb-4 md:mb-6">
                  <label htmlFor="type_probleem" className="block text-black font-medium mb-2 text-sm md:text-base">Type probleem</label>
                  <select
                    id="type_probleem"
                    name="type_probleem"
                    value={formData.type_probleem}
                    onChange={handleChange}
                    className="w-full px-3 md:px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-black border-gray-300 bg-white"
                  >
                    <option value="">Selecteer een optie (optioneel)</option>
                    <option value="opstijgend_vocht">Opstijgend vocht</option>
                    <option value="lekkage">Lekkage</option>
                    <option value="condensatie">Condensatie</option>
                    <option value="schimmel">Schimmel</option>
                    <option value="anders">Anders</option>
                  </select>
                </div>

                <div className="mb-4 md:mb-6">
                  <label htmlFor="message" className="block text-black font-medium mb-2 text-sm md:text-base">Bericht *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="4"
                    required
                    className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-black ${errors.message ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Uw bericht"
                  ></textarea>
                  {errors.message && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.message}</p>}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between">
                  <p className="text-xs md:text-sm text-black mb-3 md:mb-0">* Verplichte velden</p>
                  <button
                    type="submit"
                    className="btn btn-primary w-full md:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verzenden...
                      </span>
                    ) : (
                      'Verstuur bericht'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div ref={infoRef} className="w-full lg:w-1/3 opacity-0">
            <div className="card p-4 md:p-8 mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-black">Contactgegevens</h3>

              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <div>
                    <p className="font-medium text-black text-sm md:text-base">Adres</p>
                    <p className="text-black text-sm md:text-base">Grasbroekerweg 141</p>
                    <p className="text-black text-sm md:text-base">6412BD Heerlen</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <div>
                    <p className="font-medium text-black text-sm md:text-base">Telefoon</p>
                    <Link href="tel:+31618162515" className="text-primary hover:underline text-sm md:text-base">
                      06 18 16 25 15
                    </Link>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <div>
                    <p className="font-medium text-black text-sm md:text-base">E-mail</p>
                    <Link href="mailto:info@moonenvochtwering.nl" className="text-primary hover:underline text-sm md:text-base">
                      info@moonenvochtwering.nl
                    </Link>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="font-medium text-black text-sm md:text-base">Openingstijden</p>
                    <p className="text-black text-sm md:text-base">Ma - Vr: 08:00 - 17:00</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-4 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-black">Werkgebied</h3>
              <p className="text-black text-sm md:text-base mb-4">
                Wij zijn actief in Zuid Limburg, waaronder:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  <span className="text-black text-sm">Maastricht</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  <span className="text-black text-sm">Heerlen</span>
                </div>

                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  <span className="text-black text-sm">Echt</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  <span className="text-black text-sm">Sittard</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  <span className="text-black text-sm">Geleen</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  <span className="text-black text-sm">Valkenburg</span>
                </div>
              </div>
              <p className="text-black text-sm md:text-base mt-4">
                <strong>KVK-nummer:</strong> 14090765
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 