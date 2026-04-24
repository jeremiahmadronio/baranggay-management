import { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { About } from './About';
import { Services } from './Services';
// import { Officials } from './Officials';
import { SocialMedia } from './SocialMedia';
import { Contact } from './Contact';
import { Footer } from './Footer';

export const LandingPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    hero: heroRef,
    about: aboutRef,
    services: servicesRef,
    social: socialRef,
    contact: contactRef,
  };

  const scrollToSection = (section: string) => {
    const targetRef = refs[section];
    if (targetRef?.current) {
      const offset = 120;
      const elementPosition = targetRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  // Scroll to section if hash changes
  useEffect(() => {
    if (!location.hash) {
      if (heroRef.current) {
        const offset = 64;
        const elementPosition = heroRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
      return;
    }
    const section = location.hash.replace('#', '');
    scrollToSection(section);
  }, [location.hash]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div ref={heroRef}>
        <Hero onNavigate={scrollToSection} />
      </div>
      <div ref={aboutRef}>
        <About />
      </div>
      <div ref={servicesRef}>
        <Services />
      </div>
      {/* Officials section removed; now a separate page */}
      <div ref={socialRef}>
        <SocialMedia />
      </div>
      <div ref={contactRef}>
        <Contact />
      </div>
      <Footer onNavigate={scrollToSection} />
    </div>
  );
};

export default LandingPage;
