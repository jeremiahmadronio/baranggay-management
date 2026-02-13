import { FileText, Shield, Heart, Home, Users, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';

export const Services = () => {
  const services = [
    {
      icon: FileText,
      title: 'Barangay Clearance',
      description: 'Pagkuha ng clearance para sa employment, business, at iba pang legal na dokumento.',
      features: ['Same-day processing', 'Valid ID required', 'Php 50.00 fee'],
      color: 'blue'
    },
    {
      icon: Home,
      title: 'Certificate of Residency',
      description: 'Patunay ng paninirahan sa Barangay Ugong para sa iba\'t ibang transaksyon.',
      features: ['Proof of address needed', '1-2 days processing', 'Php 30.00 fee'],
      color: 'emerald'
    },
    {
      icon: Briefcase,
      title: 'Business Permit',
      description: 'Pagproseso ng barangay business clearance para sa mga negosyante.',
      features: ['DTI registration required', 'Annual renewal', 'Fee varies'],
      color: 'violet'
    },
    {
      icon: Shield,
      title: 'Barangay Protection Order',
      description: 'Tulong sa mga biktima ng karahasan sa pamilya o domestic abuse.',
      features: ['Free service', 'VAWC desk available', 'Confidential'],
      color: 'rose'
    },
    {
      icon: Heart,
      title: 'Health Services',
      description: 'Medical assistance, health consultations, at vaccination programs.',
      features: ['Free consultation', 'Medicine available', 'Regular medical missions'],
      color: 'amber'
    },
    {
      icon: Users,
      title: 'Senior Citizen & PWD',
      description: 'Registration at serbisyo para sa mga senior citizen at PWD.',
      features: ['ID processing', 'Benefits assistance', 'Special programs'],
      color: 'cyan'
    }
  ];

  const colorClasses: Record<string, { bg: string; text: string; light: string }> = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50' },
    violet: { bg: 'bg-violet-600', text: 'text-violet-600', light: 'bg-violet-50' },
    rose: { bg: 'bg-rose-600', text: 'text-rose-600', light: 'bg-rose-50' },
    amber: { bg: 'bg-amber-600', text: 'text-amber-600', light: 'bg-amber-50' },
    cyan: { bg: 'bg-cyan-600', text: 'text-cyan-600', light: 'bg-cyan-50' },
  };

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
            Mga Serbisyo
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
            Serbisyong Pampubliko
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Alamin ang iba't ibang serbisyo na inaalok ng Barangay Ugong 
            para sa mga residente at negosyante.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const colors = colorClasses[service.color];
            return (
              <div 
                key={index} 
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition group"
              >
                {/* Icon */}
                <div className={`w-12 h-12 ${colors.light} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <service.icon className={`w-6 h-6 ${colors.text}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className={`w-4 h-4 ${colors.text}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Link */}
                <button className={`inline-flex items-center gap-1 text-sm font-medium ${colors.text} hover:gap-2 transition-all`}>
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-blue-600 rounded-2xl p-8 sm:p-12">
            <h3 className="text-2xl font-bold text-white mb-4">
              Kailangan ng Tulong?
            </h3>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">
              Pumunta sa aming tanggapan o tumawag sa aming hotline para 
              sa karagdagang impormasyon tungkol sa aming mga serbisyo.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
                Visit 3S Center
              </button>
              <button className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                Call Hotline
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
