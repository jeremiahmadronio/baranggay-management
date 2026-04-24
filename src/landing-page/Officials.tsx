  import { Facebook, Phone, Mail, User } from 'lucide-react';

  export const Officials = () => {
    // --- DATA ---
    const barangayCaptain = {
      name: 'Maricel Pineda Emperador',
      position: 'Punong Barangay',
      contact: '09XX-XXX-XXXX',
      email: 'captain@barangayugong.gov.ph',
      facebook: 'https://facebook.com/barangayugong',
      description:
        'Your partner in building a more progressive and peaceful Barangay. Here, your welfare always comes first.',
    };
    const kagawads = [
      { name: 'Kag. Maria Santos', position: 'Peace & Order', contact: '09XX-XXX-XXXX' },
      { name: 'Kag. Jose Garcia', position: 'Health', contact: '09XX-XXX-XXXX' },
      { name: 'Kag. Ana Reyes', position: 'Education', contact: '09XX-XXX-XXXX' },
      { name: 'Kag. Pedro Ramos', position: 'Infrastructure', contact: '09XX-XXX-XXXX' },
      { name: 'Kag. Rosa Mendoza', position: 'Environment', contact: '09XX-XXX-XXXX' },
      { name: 'Kag. Luis Aquino', position: 'Social Services', contact: '09XX-XXX-XXXX' },
      { name: 'Kag. Elena Cruz', position: 'Budget & Finance', contact: '09XX-XXX-XXXX' },
    ];
    const secretary = { name: 'Maria Clara Bautista', position: 'Barangay Secretary', contact: '09XX-XXX-XXXX' };
    const treasurer = { name: 'Antonio Villanueva', position: 'Barangay Treasurer', contact: '09XX-XXX-XXXX' };
    const skOfficials = {
      chairman: { name: 'SK Chairman Miguel Santos', position: 'SK Chairperson', contact: '09XX-XXX-XXXX' },
      kagawads: [
        { name: 'SK Kag. Anna Lopez', position: 'SK Kagawad', contact: '09XX-XXX-XXXX' },
        { name: 'SK Kag. Mark Reyes', position: 'SK Kagawad', contact: '09XX-XXX-XXXX' },
        { name: 'SK Kag. Cathy Garcia', position: 'SK Kagawad', contact: '09XX-XXX-XXXX' },
        { name: 'SK Kag. John Cruz', position: 'SK Kagawad', contact: '09XX-XXX-XXXX' },
      ],
    };

    // Generic avatar component to replace all photos
    const Avatar = ({ size = 'md' }: { size?: 'lg' | 'md' | 'sm' }) => {
      const sizeClasses = {
        lg: 'w-40 h-40',
        md: 'w-20 h-20',
        sm: 'w-16 h-16',
      };
      const iconSizes = {
        lg: 'w-20 h-20',
        md: 'w-10 h-10',
        sm: 'w-8 h-8',
      };
      return (
        <div className={`${sizeClasses[size]} rounded-full bg-blue-100 border-2 border-blue-200 shadow-sm flex items-center justify-center`}>
          <User className={`${iconSizes[size]} text-blue-400`} />
        </div>
      );
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
Your partners in every step. The Barangay Council is always open for you.            </p>
          </div>

          {/* Captain */}
          <div className="flex flex-col items-center mb-16">
            <div className="bg-white rounded-xl shadow border border-blue-100 p-6 flex flex-col items-center w-full max-w-md">
              <div className="mb-4" style={{ transform: 'scale(1.18)' }}>
                <Avatar size="lg" />
              </div>
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
                <div className="mb-3">
                  <Avatar size="md" />
                </div>
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
                  <div className="mb-3">
                    <Avatar size="sm" />
                  </div>
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
                  <div className="mb-3">
                    <Avatar size="sm" />
                  </div>
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
                <div className="mb-4">
                  <Avatar size="sm" />
                </div>
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
                    <div className="mb-3">
                      <Avatar size="sm" />
                    </div>
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
