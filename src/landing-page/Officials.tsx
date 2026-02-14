import { Award, Facebook, Phone, Mail } from 'lucide-react';

// Reference Filipino stock photos (replace with your own if needed)
const stockPhotos = [
  'https://randomuser.me/api/portraits/men/75.jpg', // Captain
  'https://randomuser.me/api/portraits/women/65.jpg', // Secretary
  'https://randomuser.me/api/portraits/men/65.jpg', // Treasurer
  'https://randomuser.me/api/portraits/men/85.jpg', // Kagawad 1
  'https://randomuser.me/api/portraits/women/85.jpg', // Kagawad 2
  'https://randomuser.me/api/portraits/men/86.jpg', // Kagawad 3
  'https://randomuser.me/api/portraits/women/86.jpg', // Kagawad 4
  'https://randomuser.me/api/portraits/men/87.jpg', // Kagawad 5
  'https://randomuser.me/api/portraits/women/87.jpg', // Kagawad 6
  'https://randomuser.me/api/portraits/men/88.jpg', // Kagawad 7
  'https://randomuser.me/api/portraits/men/66.jpg', // SK Chair
  'https://randomuser.me/api/portraits/women/66.jpg', // SK Kagawad 1
  'https://randomuser.me/api/portraits/men/67.jpg', // SK Kagawad 2
  'https://randomuser.me/api/portraits/women/67.jpg', // SK Kagawad 3
  'https://randomuser.me/api/portraits/men/68.jpg', // SK Kagawad 4
];

export const Officials = () => {
  // --- DATA ---
  const barangayCaptain = {
    name: 'Hon. Juan Dela Cruz',
    position: 'Punong Barangay',
    image: stockPhotos[0],
    contact: '09XX-XXX-XXXX',
    email: 'captain@barangayugong.gov.ph',
    facebook: 'https://facebook.com/barangayugong',
    description: 'Namumuno sa Barangay Ugong na may dedikasyon at pagmamahal sa serbisyo. Laging handang tumulong sa mga pangangailangan ng ating mga kababayan.',
  };
  const kagawads = [
    { name: 'Kag. Maria Santos', position: 'Peace & Order', image: stockPhotos[3], contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Jose Garcia', position: 'Health', image: stockPhotos[4], contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Ana Reyes', position: 'Education', image: stockPhotos[5], contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Pedro Ramos', position: 'Infrastructure', image: stockPhotos[6], contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Rosa Mendoza', position: 'Environment', image: stockPhotos[7], contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Luis Aquino', position: 'Social Services', image: stockPhotos[8], contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Elena Cruz', position: 'Budget & Finance', image: stockPhotos[9], contact: '09XX-XXX-XXXX' },
  ];
  const secretary = { name: 'Maria Clara Bautista', position: 'Barangay Secretary', image: stockPhotos[1], contact: '09XX-XXX-XXXX' };
  const treasurer = { name: 'Antonio Villanueva', position: 'Barangay Treasurer', image: stockPhotos[2], contact: '09XX-XXX-XXXX' };
  const skOfficials = {
    chairman: { name: 'SK Chairman Miguel Santos', position: 'SK Chairperson', image: stockPhotos[10], contact: '09XX-XXX-XXXX' },
    kagawads: [
      { name: 'SK Kag. Anna Lopez', position: 'SK Kagawad', image: stockPhotos[11] },
      { name: 'SK Kag. Mark Reyes', position: 'SK Kagawad', image: stockPhotos[12] },
      { name: 'SK Kag. Cathy Garcia', position: 'SK Kagawad', image: stockPhotos[13] },
      { name: 'SK Kag. John Cruz', position: 'SK Kagawad', image: stockPhotos[14] },
    ],
  };

  return (
    <section id="officials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-4xl sm:text-5xl font-bold text-blue-900 mb-3 tracking-tight">
            Barangay <span className="text-blue-900">Officials</span>
          </h2>
          <p className="text-lg text-blue-900/70 leading-relaxed">
            Kilalanin ang mga pinuno at opisyales ng Barangay Ugong na naglilingkod sa ating komunidad.
          </p>
        </div>

        {/* Captain */}
        <div className="flex flex-col items-center mb-16">
          <div className="bg-blue-900 rounded-2xl shadow-lg border border-blue-900 p-8 flex flex-col items-center w-full max-w-md">
            <img src={barangayCaptain.image} alt={barangayCaptain.name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow mb-4" />
            <span className="inline-block bg-white text-blue-900 text-xs font-semibold px-4 py-1 rounded-full mb-2 tracking-wide">
              {barangayCaptain.position}
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{barangayCaptain.name}</h3>
            <p className="text-blue-100 text-center max-w-lg mb-4 text-sm sm:text-base">{barangayCaptain.description}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={barangayCaptain.facebook} className="inline-flex items-center gap-2 bg-white hover:bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-semibold transition-all duration-300 border border-blue-900">
                <Facebook className="w-5 h-5" /> Facebook
              </a>
              <a href={`tel:${barangayCaptain.contact}`} className="inline-flex items-center gap-2 bg-white hover:bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-semibold transition-all duration-300 border border-blue-900">
                <Phone className="w-5 h-5" /> Contact
              </a>
              <a href={`mailto:${barangayCaptain.email}`} className="inline-flex items-center gap-2 bg-white hover:bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-semibold transition-all duration-300 border border-blue-900">
                <Mail className="w-5 h-5" /> Email
              </a>
            </div>
          </div>
        </div>

        {/* Secretary & Treasurer */}
        <div className="flex flex-col sm:flex-row justify-center gap-8 mb-16">
          {[secretary, treasurer].map((official, idx) => (
            <div key={idx} className="bg-blue-900 rounded-2xl p-6 flex-1 min-w-[220px] max-w-xs shadow-lg border border-blue-900 flex flex-col items-center">
              <img src={official.image} alt={official.name} className="w-20 h-20 rounded-full object-cover border-2 border-white shadow mb-3" />
              <h4 className="font-bold text-white text-lg mb-1">{official.name}</h4>
              <p className="text-xs text-blue-100 mb-2">{official.position}</p>
              <div className="flex gap-2 mt-2">
                <a href={`tel:${official.contact}`} className="p-2 text-blue-900 bg-white hover:bg-blue-100 rounded-lg transition border border-blue-900"><Phone className="w-4 h-4" /></a>
                <a href="#" className="p-2 text-blue-900 bg-white hover:bg-blue-100 rounded-lg transition border border-blue-900"><Mail className="w-4 h-4" /></a>
              </div>
            </div>
          ))}
        </div>

        {/* Kagawads */}
        <div className="mb-16">
          <h3 className="text-xl font-bold text-blue-900 mb-8 text-center tracking-wide">Sangguniang Barangay</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6">
            {kagawads.map((k, idx) => (
              <div key={idx} className="bg-blue-900 rounded-2xl p-5 shadow-lg border border-blue-900 flex flex-col items-center">
                <img src={k.image} alt={k.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow mb-3" />
                <h4 className="font-bold text-white text-base mb-1">{k.name}</h4>
                <p className="text-xs text-blue-100 mb-2">{k.position}</p>
                <div className="flex gap-2 mt-2">
                  <a href={`tel:${k.contact}`} className="p-2 text-blue-900 bg-white hover:bg-blue-100 rounded-lg transition border border-blue-900"><Phone className="w-4 h-4" /></a>
                  <a href="#" className="p-2 text-blue-900 bg-white hover:bg-blue-100 rounded-lg transition border border-blue-900"><Mail className="w-4 h-4" /></a>
                  <a href="#" className="p-2 text-blue-900 bg-white hover:bg-blue-100 rounded-lg transition border border-blue-900"><Facebook className="w-4 h-4" /></a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SK Section */}
        <div className="bg-blue-900 rounded-2xl p-8 sm:p-12 border border-blue-900">
          <h3 className="text-xl font-bold text-white mb-8 text-center tracking-wide">Sangguniang Kabataan</h3>
          <div className="flex flex-col items-center gap-8">
            {/* SK Chairman */}
            <div className="bg-white rounded-2xl p-6 shadow border border-blue-900 text-center max-w-sm w-full">
              <img src={skOfficials.chairman.image} alt={skOfficials.chairman.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-900 shadow mb-4 mx-auto" />
              <span className="inline-block bg-blue-900 text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">SK Chairperson</span>
              <h4 className="font-bold text-blue-900 text-lg">{skOfficials.chairman.name}</h4>
              <p className="text-sm text-blue-900 mt-2">{skOfficials.chairman.contact}</p>
            </div>
            {/* SK Kagawads */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl">
              {skOfficials.kagawads.map((sk, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 shadow border border-blue-900 text-center hover:shadow-lg transition-all duration-300">
                  <img src={sk.image} alt={sk.name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-900 shadow mb-3 mx-auto" />
                  <h5 className="font-semibold text-blue-900 text-xs">{sk.name}</h5>
                  <p className="text-xs text-blue-900 mt-1">{sk.position}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Officials;
