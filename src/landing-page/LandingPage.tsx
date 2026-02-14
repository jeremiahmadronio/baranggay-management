import { useRef } from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { About } from './About';
import { Services } from './Services';
import { Officials } from './Officials';
import { SocialMedia } from './SocialMedia';
import { Contact } from './Contact';
import { Footer } from './Footer';

export const LandingPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const officialsRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (section: string) => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      hero: heroRef,
      about: aboutRef,
      services: servicesRef,
      officials: officialsRef,
      social: socialRef,
      contact: contactRef,
    };

    const targetRef = refs[section];
    if (targetRef?.current) {
      const offset = 64; // Navbar height
      const elementPosition = targetRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar onNavigate={scrollToSection} />
      
      <div ref={heroRef}>
        <Hero onNavigate={scrollToSection} />
      </div>
      
      <div ref={aboutRef}>
        <About />
      </div>
      
      <div ref={servicesRef}>
        <Services />
      </div>
      
      <div ref={officialsRef}>
        <Officials />
      </div>

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
