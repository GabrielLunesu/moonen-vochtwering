'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  
  const contactRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      },
      { threshold: 0.1 }
    );

    if (contactRef.current) {
      observer.observe(contactRef.current);
    }

    return () => {
      if (contactRef.current) {
        observer.unobserve(contactRef.current);
      }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: ''
      });
      
      // Scroll to form top to show success message
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    }, 1500);
  };

  return (
    <section id="contact" className="section py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Contact Opnemen</h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-gray-700 max-w-3xl mx-auto">
            Heeft u vragen over onze diensten of wilt u een afspraak maken? Vul onderstaand formulier in of neem direct contact met ons op.
          </p>
        </div>

        <div 
          ref={contactRef}
          className="flex flex-col lg:flex-row gap-12 opacity-0"
        >
          <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-md p-6 md:p-8">
            <div ref={formRef}>
              {submitSuccess ? (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-6 animate-fade-in">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <p className="font-medium">Bedankt voor uw bericht!</p>
                      <p>We nemen zo spoedig mogelijk contact met u op.</p>
                    </div>
                  </div>
                </div>
              ) : submitError ? (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 animate-fade-in">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <p className="font-medium">Er is iets misgegaan!</p>
                      <p>Probeer het later nog eens of neem telefonisch contact met ons op.</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Naam *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Uw naam"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">E-mail *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="uw@email.nl"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">Telefoonnummer</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Uw telefoonnummer"
                  />
                </div>
                <div>
                  <label htmlFor="service" className="block text-gray-700 font-medium mb-2">Dienst</label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    <option value="">Selecteer een dienst</option>
                    <option value="airco-installatie">Airconditioning Installatie</option>
                    <option value="warmtepomp-installatie">Warmtepomp Installatie</option>
                    <option value="airco-service">Airconditioning Service</option>
                    <option value="airco-reparatie">Airconditioning Reparatie</option>
                    <option value="warmtepomp-service">Warmtepomp Service</option>
                    <option value="warmtepomp-reparatie">Warmtepomp Reparatie</option>
                    <option value="anders">Anders</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Bericht *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${errors.message ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Uw bericht"
                ></textarea>
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">* Verplichte velden</p>
                <button
                  type="submit"
                  className={`btn-primary px-8 py-3 rounded-full font-medium flex items-center justify-center min-w-[180px] transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verzenden...
                    </>
                  ) : (
                    'Verstuur bericht'
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4">Contactgegevens</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <div>
                    <p className="font-medium">Adres</p>
                    <p className="text-gray-600">Voorbeeldstraat 123</p>
                    <p className="text-gray-600">1234 AB Amsterdam</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <div>
                    <p className="font-medium">Telefoon</p>
                    <p className="text-gray-600">
                      <Link href="tel:+31612345678" className="hover:text-primary transition-colors">
                        +31 6 12345678
                      </Link>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <div>
                    <p className="font-medium">E-mail</p>
                    <p className="text-gray-600">
                      <Link href="mailto:info@donatolunesu.nl" className="hover:text-primary transition-colors">
                        info@donatolunesu.nl
                      </Link>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="font-medium">Openingstijden</p>
                    <p className="text-gray-600">Maandag - Vrijdag: 08:00 - 17:00</p>
                    <p className="text-gray-600">Zaterdag: Op afspraak</p>
                    <p className="text-gray-600">Zondag: Gesloten</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-primary text-white rounded-lg shadow-md p-6 md:p-8">
              <h3 className="text-xl font-semibold mb-4">Noodgevallen</h3>
              <p className="mb-4">
                Heeft u een spoedgeval buiten kantooruren? Bel ons noodnummer en we helpen u zo snel mogelijk.
              </p>
              <Link 
                href="tel:+31612345678" 
                className="bg-white text-primary px-6 py-2 rounded-full font-medium inline-flex items-center hover:bg-gray-100 transition-colors duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                +31 6 12345678
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 