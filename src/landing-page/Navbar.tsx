
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Mail, Clock, Calendar } from 'lucide-react';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/#about' },
    { label: 'Services', href: '/#services' },
    { label: 'Officials', href: '/officials' },
    { label: 'Contact', href: '/#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar - Contact Info */}
      <div className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>(02) 8292-XXXX</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>barangay.ugong@valenzuela.gov.ph</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-blue-200">
              <Clock className="w-4 h-4" />
              <span>Lunes - Biyernes, 8:00 AM - 5:00 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`transition-all duration-300 overflow-visible ${isScrolled ? 'bg-blue-800 shadow-lg' : 'bg-blue-800'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            {/* Logo - Oversized */}
            <Link to="/" className="flex items-center gap-4 cursor-pointer relative" onClick={() => setIsOpen(false)}>
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-white p-1.5 shadow-xl border-4 border-blue-200 absolute top-1/2 -translate-y-1/3 left-0">
                <img 
                  src="/logo.png" 
                  alt="Barangay Ugong Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="hidden sm:block ml-24 lg:ml-28">
                <h1 className="font-bold text-white text-lg lg:text-xl leading-tight">
                  BARANGAY UGONG
                </h1>
                <p className="text-blue-200 text-sm">
                  Lungsod ng Valenzuela
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-4 py-2 text-base font-medium text-white relative group"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-white group-hover:w-3/4 transition-all duration-300" />
                </Link>
              ))}
              <Link
                to="/events"
                className="px-4 py-2 text-base font-medium text-white relative group flex items-center gap-1"
              >
                <Calendar className="w-4 h-4" />
                Events
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-white group-hover:w-3/4 transition-all duration-300" />
              </Link>
            </div>

            {/* CTA Button */}
            <div className="hidden lg:block">
              <Link 
                to="/login"
                className="bg-white hover:bg-blue-50 text-blue-800 px-6 py-3 rounded-lg text-sm font-bold transition-colors shadow-md"
              >
               Login as a member
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded text-white hover:bg-blue-700"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden bg-blue-800 border-t border-blue-700">
            <div className="max-w-7xl mx-auto px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-3 text-left text-white hover:bg-blue-700 rounded transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/events"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-3 text-left text-white hover:bg-blue-700 rounded transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Events Calendar
              </Link>
              <Link 
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full mt-4 bg-white hover:bg-blue-50 text-blue-800 px-4 py-3 rounded-lg font-bold transition-colors text-center"
              >
                Kumuha ng Serbisyo
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
