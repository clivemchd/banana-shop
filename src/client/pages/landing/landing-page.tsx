import React, { useEffect } from 'react';
import Navbar from './navbar';
import Hero from './hero';
import Features from './features';
import Testimonials from './testimonials';
import FAQ from './faq';
import Pricing from './pricing';
import Footer from './footer';

export const LandingPage = () => {
  useEffect(() => {
    // Handle scrolling to sections when page loads with hash
    const handleHashScroll = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100); // Small delay to ensure elements are rendered
      }
    };

    // Handle initial load
    handleHashScroll();

    // Handle hash changes (for SPA navigation)
    window.addEventListener('hashchange', handleHashScroll);

    return () => {
      window.removeEventListener('hashchange', handleHashScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        {/* Hidden for now */}
        {/* <Testimonials /> */}
        {/* <FAQ /> */}
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};
