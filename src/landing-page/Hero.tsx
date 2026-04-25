import { ChevronRight } from 'lucide-react';

interface HeroProps {
  onNavigate?: (section: string) => void;
}

export const Hero = ({ onNavigate }: HeroProps) => {
  return (
    <section className="relative min-h-screen bg-white">
      <div 
        className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/Barangay landing.jpg')` }}
      >
        {/* Gradient fade on left edge only */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent lg:via-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 lg:pt-40 w-full">
          <div className="max-w-xl bg-white/95 lg:bg-transparent p-6 lg:p-0 rounded-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-900 leading-tight mb-6">
              Barangay Ugong
              <span className="block text-blue-600">City of Valenzuela</span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Serving the community with dedication and integrity. 
              Together, let's build a better and more progressive barangay.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => onNavigate?.('services')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg"
              >
                Our Services
                <ChevronRight className="w-6 h-6" />
              </button>
              <button 
                onClick={() => onNavigate?.('contact')}
                className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 px-8 py-4 rounded-lg font-bold text-lg border-2 border-blue-600 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
