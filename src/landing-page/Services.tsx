import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ChevronDown,
  Clock,
  FileText,
  Home,
  Briefcase,
  Shield,
  Heart,
  Users,
  Scale,
  Baby,
  Building2,
} from 'lucide-react';

export const Services = () => {
  const [showAll, setShowAll] = useState(false);

  const services = [
    {
      icon: FileText,
      title: 'Barangay Clearance',
      description: 'Official clearance document for employment, business registration, and other legal purposes.',
      image: '/clearance.png',
      fee: '₱50.00',
      processingTime: '15-30 mins',
      requirements: ['Valid ID (Government-issued)', 'Cedula/Community Tax Certificate', '2x2 ID Picture (2 pcs)'],
    },
    {
      icon: Home,
      title: 'Certificate of Residency',
      description: 'Proof of residence in Barangay Ugong for various transactions and requirements.',
      image: '/residency.png',
      fee: '₱30.00',
      processingTime: '1-2 days',
      requirements: ['Valid ID', 'Proof of Billing Address', 'Barangay Clearance'],
    },
    {
      icon: Briefcase,
      title: 'Business Permit',
      description: 'Barangay business clearance processing for entrepreneurs and business owners.',
      image: '/busines-permit.jfif',
      fee: 'Varies',
      processingTime: '3-5 days',
      requirements: ['DTI/SEC Registration', 'Barangay Clearance', 'Valid ID of Owner', 'Contract of Lease/Land Title'],
    },
    {
      icon: Shield,
      title: 'Barangay Protection Order',
      description: 'Assistance for victims of domestic violence and family abuse cases.',
      image: '/barangay-protection.webp',
      fee: 'FREE',
      processingTime: 'Immediate',
      requirements: ['Valid ID (if available)', 'Incident Report/Statement'],
    },
    {
      icon: Heart,
      title: 'Health Services',
      description: 'Medical assistance, consultations, and vaccination programs for residents.',
      image: '/health.png',
      imagePosition: 'object-center',
      fee: 'FREE',
      processingTime: 'Walk-in',
      requirements: ['Valid ID', 'Barangay Clearance', 'PhilHealth ID (if available)'],
    },
    {
      icon: Users,
      title: 'Senior Citizen & PWD ID',
      description: 'Registration and services for senior citizens and persons with disabilities.',
      image: '/senior-citizen.jpg',
      fee: 'FREE',
      processingTime: '5-7 days',
      requirements: ['Birth Certificate/Valid ID', '1x1 ID Picture (2 pcs)', 'Medical Certificate (for PWD)'],
    },
    {
      icon: Scale,
      title: 'Lupong Tagapamayapa',
      description: 'Mediation and dispute resolution services for community conflicts.',
      image: '/lupong-tagapagpayapa.jpg',
      imagePosition: 'object-bottom',
      fee: 'FREE',
      processingTime: 'By schedule',
      requirements: ['Valid ID of Complainant', 'Written Complaint'],
    },
    {
      icon: Baby,
      title: 'Birth Certificate Assistance',
      description: 'Help with late registration and birth certificate processing.',
      image: '/birt-cert.png',
      fee: '₱100.00',
      processingTime: '2-3 weeks',
      requirements: ['Certificate of Live Birth (hospital)', 'Valid ID of Parent', 'Marriage Certificate (if married)', 'Affidavit of Late Registration'],
    },
    {
      icon: Building2,
      title: 'Fencing/Building Permit',
      description: 'Barangay endorsement for construction and building permit applications.',
      image: '/construction.png',
      fee: '₱200.00',
      processingTime: '3-5 days',
      requirements: ['Land Title/Tax Declaration', 'Building Plan/Blueprint', 'Valid ID of Owner', 'Lot Plan'],
    },
  ];

  const displayedServices = showAll ? services : services.slice(0, 6);

  return (
    <section id="services" className="pt-10 pb-20 bg-gray-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-10">
          
          <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2 leading-tight">
            Public Services
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-snug">
            Fast, reliable, and accessible services for all residents of Barangay Ugong.
          </p>
        </div>

        {/* Services Grid - Clean Card Design */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
          <AnimatePresence mode="wait">
            {displayedServices.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="group"
              >
                <div className="bg-white rounded-2xl overflow-hidden h-full flex flex-col shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
                  
                  {/* Image Section */}
                  <div className="relative h-40 md:h-44 overflow-hidden">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${service.imagePosition || 'object-top'}`}
                    />
                    {/* Subtle gradient at bottom only for text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                    
                    {/* Icon Badge */}
                    <div className="absolute top-4 left-4">
                      <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
                        <service.icon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>

                    {/* Fee Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${
                        service.fee === 'FREE' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-white/90 backdrop-blur-sm text-blue-900'
                      }`}>
                        {service.fee}
                      </span>
                    </div>

                    {/* Title on Image */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-base md:text-lg font-bold text-white drop-shadow-md leading-tight">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 md:p-5 flex-1 flex flex-col">
                    <p className="text-gray-700 text-xs md:text-sm leading-relaxed mb-3 flex-1">
                      {service.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs md:text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{service.processingTime}</span>
                      </div>
                      <Link to="/login" className="inline-flex items-center gap-1 text-blue-600 font-medium text-xs md:text-sm hover:text-blue-700 transition-colors group/btn">
                        Learn more
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Load More Button with Animation */}
        <div className="mt-10 text-center" style={{ minHeight: '80px' }}>
          <motion.button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm"
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.span
              key={showAll ? 'less' : 'all'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {showAll ? 'Show Less' : 'View All Services'}
            </motion.span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} />
          </motion.button>
          <AnimatePresence>
            {!showAll && (
              <motion.p
                key="extra"
                className="mt-3 text-sm text-gray-500"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                +{services.length - 6} more services
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* CTA Section */}
        <div className="mt-16">
          <div className="bg-blue-900 rounded-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              {/* Content */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                  Need Assistance?
                </h3>
                <p className="text-blue-200 mb-8 leading-relaxed">
                  Visit our 3S Center or call our hotline. 
                  We are open Monday to Friday, 8:00 AM - 5:00 PM.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="inline-flex items-center justify-center gap-2 bg-white text-blue-900 px-6 py-3.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                    <Building2 className="w-5 h-5" />
                    Visit 3S Center
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 bg-blue-800 text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors border border-blue-700">
                    Call: (02) 8292-6754
                  </button>
                </div>
              </div>
              
              {/* Image */}
              <div className="hidden lg:block relative h-full min-h-[300px]">
                <img 
                  src="/helping.png"
                  alt="Need Assistance"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-transparent" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Services;
