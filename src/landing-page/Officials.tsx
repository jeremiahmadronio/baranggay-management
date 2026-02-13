import { Facebook, Phone, Mail } from 'lucide-react';

export const Officials = () => {
  const officials = [
    {
      name: 'Hon. Punong Barangay',
      position: 'Barangay Captain',
      image: null,
      contact: '09XX-XXX-XXXX'
    },
    {
      name: 'Kagawad 1',
      position: 'Committee on Peace & Order',
      image: null,
      contact: '09XX-XXX-XXXX'
    },
    {
      name: 'Kagawad 2',
      position: 'Committee on Health',
      image: null,
      contact: '09XX-XXX-XXXX'
    },
    {
      name: 'Kagawad 3',
      position: 'Committee on Education',
      image: null,
      contact: '09XX-XXX-XXXX'
    },
    {
      name: 'Kagawad 4',
      position: 'Committee on Infrastructure',
      image: null,
      contact: '09XX-XXX-XXXX'
    },
    {
      name: 'Kagawad 5',
      position: 'Committee on Environment',
      image: null,
      contact: '09XX-XXX-XXXX'
    },
    {
      name: 'Kagawad 6',
      position: 'Committee on Social Services',
      image: null,
      contact: '09XX-XXX-XXXX'
    },
    {
      name: 'Kagawad 7',
      position: 'Committee on Budget & Finance',
      image: null,
      contact: '09XX-XXX-XXXX'
    },
  ];

  const skOfficials = [
    { name: 'SK Chairperson', position: 'SK Chairman', contact: '09XX-XXX-XXXX' },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <section id="officials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
            Mga Opisyales
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
            Barangay Officials
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Kilalanin ang mga pinuno at opisyales ng Barangay Ugong 
            na naglilingkod sa ating komunidad.
          </p>
        </div>

        {/* Barangay Captain - Featured */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 sm:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-4xl sm:text-5xl font-bold text-white">PB</span>
              </div>
              <div className="text-center md:text-left">
                <span className="text-blue-200 text-sm font-medium">Punong Barangay</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  Hon. Barangay Captain
                </h3>
                <p className="text-blue-100 mt-2 max-w-xl">
                  Namumuno sa Barangay Ugong na may dedikasyon at pagmamahal sa serbisyo. 
                  Laging handang tumulong sa mga pangangailangan ng ating mga kababayan.
                </p>
                <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                  <a href="#" className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition">
                    <Facebook className="w-5 h-5" />
                    Facebook
                  </a>
                  <a href="tel:09XXXXXXXXX" className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition">
                    <Phone className="w-5 h-5" />
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kagawads Grid */}
        <div className="mb-16">
          <h3 className="text-xl font-bold text-gray-900 mb-8 text-center">Sangguniang Barangay</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {officials.slice(1).map((official, index) => (
              <div 
                key={index}
                className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition group"
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition">
                  <span className="text-xl font-bold text-blue-600 group-hover:text-white transition">
                    {getInitials(official.name)}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900">{official.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{official.position}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SK Officials */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-8 text-center">Sangguniang Kabataan</h3>
          <div className="max-w-sm mx-auto">
            {skOfficials.map((official, index) => (
              <div 
                key={index}
                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 text-center border border-blue-100"
              >
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-white">
                    {getInitials(official.name)}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900">{official.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{official.position}</p>
                <p className="text-sm text-blue-600 mt-2">{official.contact}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Officials;
