'use client';

import Navbar from './components/new/Navbar';
import Hero from './components/new/Hero';
import Services from './components/new/Services';
import Oplossingen from './components/new/Oplossingen';
import Werkwijze from './components/new/Werkwijze';
import About from './components/new/About';
import Contact from './components/new/Contact';
import Footer from './components/new/Footer';
import ScrollToTop from './components/new/ScrollToTop';

export default function Home() {
  return (
    <main className="bg-white">
      <Navbar />
      <Hero />
      <Services />
      <Oplossingen />
      <Werkwijze />
      <About />
      <Contact />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
