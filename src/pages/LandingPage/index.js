import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Chatbot from '../../components/chatbot';

import Hero from './sections/Hero/Hero';
import Processus from './sections/Processus/Processus';
import Clients from './sections/Clients/Clients';
import Trust from './sections/Trust/Trust';
import Pricing from './sections/Pricing/Pricing';
import Urgence from './sections/Urgence/Urgence';
import Diaspora from './sections/Diaspora/Diaspora';

import './LandingPage.css';
import FAQ from './sections/FAQ';

const LandingPage = () => {
  return (
    <div className="homepage">
      <Navbar />
      <div style={{ marginTop: "80px" }}>
      <Hero />
      <Processus />
      <Clients />
      <Trust />
      <Pricing />
      <Urgence />
      <Diaspora />
      <FAQ/>
      <Footer />
      </div>
    </div>
  );
};

export default LandingPage;