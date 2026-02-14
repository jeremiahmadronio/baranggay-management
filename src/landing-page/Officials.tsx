  import { Facebook, Phone, Mail } from 'lucide-react';

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
      name: 'Maricel Pineda Emperador',
      position: 'Punong Barangay',
      image: '/kapitana-profile.png', // Local profile image from public folder
      contact: '09XX-XXX-XXXX',
      email: 'captain@barangayugong.gov.ph',
      facebook: 'https://facebook.com/barangayugong',
      description:
        'Kaagapay ng bawat pamilya sa pagtataguyod ng mas maunlad at payapang Barangay. Dito, ang kapakanan niyo ang laging una.',
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
        { name: 'SK Kag. Anna Lopez', position: 'SK Kagawad', image: stockPhotos[11], contact: '09XX-XXX-XXXX' },
        { name: 'SK Kag. Mark Reyes', position: 'SK Kagawad', image: stockPhotos[12], contact: '09XX-XXX-XXXX' },
        { name: 'SK Kag. Cathy Garcia', position: 'SK Kagawad', image: stockPhotos[13], contact: '09XX-XXX-XXXX' },
        { name: 'SK Kag. John Cruz', position: 'SK Kagawad', image: stockPhotos[14], contact: '09XX-XXX-XXXX' },
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
Katuwang ninyo sa bawat hakbang. Ang Sangguniang Barangay na laging bukas para sa inyo.            </p>
          </div>

          {/* Captain */}
          <div className="flex flex-col items-center mb-16">
            <div className="bg-white rounded-xl shadow border border-blue-100 p-6 flex flex-col items-center w-full max-w-md">
              <img src={barangayCaptain.image} alt={barangayCaptain.name} className="w-40 h-40 rounded-full object-cover border-4 shadow-md mb-4" style={{ borderColor: '#1E2A5E', borderStyle: 'solid', objectPosition: 'center', objectFit: 'cover', transform: 'scale(1.18)' }} />
              <span className="inline-block bg-blue-900 text-white text-xs font-semibold px-4 py-1 rounded-full mb-2 tracking-wide">
                {barangayCaptain.position}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-blue-900 mb-1">{barangayCaptain.name}</h3>
              <p className="text-blue-900 text-center max-w-lg mb-4 text-base sm:text-lg italic font-medium leading-relaxed">{barangayCaptain.description}</p>
              {/* Contact Actions - Clean & Elegant */}
<div className="flex flex-wrap gap-3 justify-center mt-6">
  
  {/* Call Button */}
  <a 
    href={`tel:${barangayCaptain.contact}`}
    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-md"
  >
    <Phone className="w-4 h-4" /> 
    <span className="text-sm font-semibold">{barangayCaptain.contact}</span>
  </a>
  
  {/* Facebook Button */}
  <a 
    href={barangayCaptain.facebook}
    target="_blank" 
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-md"
  >
    <Facebook className="w-4 h-4" /> 
    <span className="text-sm font-semibold">Facebook</span>
  </a>
  
  {/* Email Button */}
  <a 
    href={`mailto:${barangayCaptain.email}`}
    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors shadow-md"
  >
    <Mail className="w-4 h-4" /> 
    <span className="text-sm font-semibold">Email</span>
  </a>
  
</div>
            </div>
          </div>

          {/* Secretary & Treasurer */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
            {[secretary, treasurer].map((official, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 flex-1 min-w-[220px] max-w-xs shadow border border-blue-100 flex flex-col items-center">
                <img src={official.image} alt={official.name} className="w-20 h-20 rounded-full object-cover border-2 border-blue-200 shadow-sm mb-3" />
                <span className="inline-block bg-blue-900 text-white text-xs font-semibold px-3 py-1 rounded-full mb-2 tracking-wide">
                  {official.position}
                </span>
                <h4 className="font-bold text-blue-900 text-base mb-1">{official.name}</h4>
                <span className="mt-2 flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {official.contact}
                </span>
              </div>
            ))}
          </div>

          {/* Kagawads */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-blue-900 mb-8 text-center tracking-wide">Sangguniang Barangay</h3>
            {/* First row: 4 kagawads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {kagawads.slice(0, 4).map((k, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 shadow border border-blue-100 flex flex-col items-center">
                  <img src={k.image} alt={k.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow-sm mb-3" />
                  <span className="inline-block bg-blue-900 text-white text-xs font-semibold px-3 py-1 rounded-full mb-2 tracking-wide">
                    {k.position}
                  </span>
                  <h4 className="font-bold text-blue-900 text-base mb-1">{k.name}</h4>
                  <span className="mt-2 flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {k.contact}
                  </span>
                </div>
              ))}
            </div>
            {/* Second row: 3 kagawads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {kagawads.slice(4).map((k, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 shadow border border-blue-100 flex flex-col items-center">
                  <img src={k.image} alt={k.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow-sm mb-3" />
                  <span className="inline-block bg-blue-900 text-white text-xs font-semibold px-3 py-1 rounded-full mb-2 tracking-wide">
                    {k.position}
                  </span>
                  <h4 className="font-bold text-blue-900 text-base mb-1">{k.name}</h4>
                  <span className="mt-2 flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {k.contact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SK Section */}
          <div className="bg-white rounded-xl p-8 sm:p-12 border border-blue-100">
            <h3 className="text-xl font-bold text-blue-900 mb-8 text-center tracking-wide">Sangguniang Kabataan</h3>
            <div className="flex flex-col items-center gap-8">
              {/* SK Chairman */}
              <div className="bg-white rounded-xl p-6 shadow border border-blue-100 text-center max-w-sm w-full flex flex-col items-center">
                <img src={skOfficials.chairman.image} alt={skOfficials.chairman.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow-sm mb-4 mx-auto" />
                <span className="inline-block bg-blue-900 text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">SK Chairperson</span>
                <h4 className="font-bold text-blue-900 text-lg">{skOfficials.chairman.name}</h4>
                <span className="mt-2 flex items-center gap-2 text-slate-500 text-sm font-medium justify-center w-fit mx-auto">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {skOfficials.chairman.contact}
                </span>
              </div>
              {/* SK Kagawads */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full max-w-3xl">
                {skOfficials.kagawads.map((sk, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow border border-blue-100 text-center flex flex-col items-center min-w-[160px] max-w-[220px] mx-auto">
                    <img src={sk.image} alt={sk.name} className="w-14 h-14 rounded-full object-cover border-2 border-blue-200 shadow-sm mb-3 mx-auto" />
                    <span className="inline-block bg-blue-900 text-white text-sm font-semibold px-3 py-1 rounded-full mt-1 mb-2">{sk.position}</span>
                    <h5 className="font-semibold text-blue-900 text-sm mb-1">{sk.name}</h5>
                    {sk.contact && (
                      <span className="mt-1 flex items-center gap-2 text-slate-500 text-sm font-medium justify-center w-fit mx-auto">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {sk.contact}
                      </span>
                    )}
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
