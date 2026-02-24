import { Link } from 'react-router-dom';
import { Facebook, Phone, Mail, MapPin, Heart, Calendar } from 'lucide-react';

interface FooterProps {
  onNavigate?: (section: string) => void;
}

export const Footer = ({ onNavigate }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Home', href: 'hero' },
    { label: 'Tungkol sa Amin', href: 'about' },
    { label: 'Mga Serbisyo', href: 'services' },
    { label: 'Mga Opisyales', href: 'officials' },
    { label: 'Social Media', href: 'social' },
    { label: 'Contact', href: 'contact' },
  ];

  const services = [
    { label: 'Barangay Clearance', href: '#' },
    { label: 'Business Permit', href: '#' },
    { label: 'Certificate of Residency', href: '#' },
    { label: 'Barangay ID', href: '#' },
    { label: 'Health Services', href: '#' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Barangay Ugong</h3>
                <p className="text-sm text-gray-400">Valenzuela City</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Naglilingkod sa komunidad ng Barangay Ugong mula 1963. 
              Sama-sama nating itaguyod ang progreso at kapayapaan sa ating barangay.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.facebook.com/barangayugongvalenzuelacity" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => onNavigate?.(link.href)}
                    className="text-gray-400 hover:text-white transition text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <Link
                  to="/events"
                  className="text-gray-400 hover:text-white transition text-sm flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Events Calendar
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-6">Mga Serbisyo</h4>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <li key={index}>
                  <a 
                    href={service.href}
                    className="text-gray-400 hover:text-white transition text-sm"
                  >
                    {service.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-6">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">
                  3S Center, Barangay Ugong, Valenzuela City
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-400">(02) 8292-XXXX</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-400">barangay.ugong@valenzuela.gov.ph</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} Barangay Ugong, Valenzuela City. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500" /> for our community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
