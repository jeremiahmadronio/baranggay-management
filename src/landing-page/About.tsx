import { Target, Eye } from 'lucide-react';

export const About = () => {
  const stats = [
    { value: '50,000+', label: 'Residents' },
    { value: '15', label: 'Puroks' },
    { value: '1963', label: 'Year Established' },
    { value: '24/7', label: 'Ready to Serve' },
  ];

  return (
    <section id="about" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden h-48 shadow-lg">
                <img 
                  src="/Screenshot 2026-02-14 041042.png" 
                  alt="Barangay Ugong 1"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="rounded-2xl overflow-hidden h-64 shadow-lg">
                <img 
                  src="/Screenshot 2026-02-14 041143.png" 
                  alt="Barangay Ugong 2"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="rounded-2xl overflow-hidden h-72 shadow-lg">
                <img 
                  src="/Screenshot 2026-02-14 041219.png" 
                  alt="Barangay Ugong 3"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="rounded-2xl overflow-hidden h-40 shadow-lg">
                <img 
                  src="/Screenshot 2026-02-14 041532.png" 
                  alt="Barangay Ugong 4"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-blue-600 font-semibold tracking-wide mb-2">About Us</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-blue-900 leading-tight mb-6">
              Together Towards a Better Tomorrow
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Since 1963, Barangay Ugong has continuously grown alongside every 
              family that calls it home. We are not just a barangay — we are 
              a community that cares for one another.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              At our 3S Center, you'll find all the services every 
              resident needs, from document processing to programs for 
              the youth, elderly, and families.
            </p>

            {/* Vision & Mission - Simplified */}
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 border-l-4 border-blue-600 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-blue-900">Our Vision</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  A place that is safe, prosperous, and for everyone.
                </p>
              </div>
              <div className="flex-1 border-l-4 border-blue-600 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-blue-900">Our Mission</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Fast, honest, and accessible service for all.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 bg-blue-900 rounded-2xl p-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl lg:text-5xl font-bold text-white">{stat.value}</p>
                <p className="text-blue-300 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default About;
