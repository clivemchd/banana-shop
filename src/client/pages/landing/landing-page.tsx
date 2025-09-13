import React from 'react';
import Navbar from './navbar';
import Hero from './hero';
import Features from './features';
import Testimonials from './testimonials';
import FAQ from './faq';
import Pricing from './pricing';
import Footer from './footer';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        {/* Hidden for now */}
        {/* <Testimonials /> */}
        <FAQ />
        <Pricing />
      </main>
      {/* <Footer /> */}
    </div>
  );
};
