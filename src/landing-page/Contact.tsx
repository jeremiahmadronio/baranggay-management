import { MapPin, Phone, Mail, Clock, Facebook } from 'lucide-react';

export const Contact = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Our Location',
      content: '3S Center, Barangay Ugong',
      subtext: 'Valenzuela City, Metro Manila',
      // Changed to Blue Theme
      color: 'bg-blue-50 text-blue-600', 
      delay: 0
    },
    {
      icon: Phone,
      title: 'Call Us',
      content: '(02) 8292-XXXX',
      subtext: 'Hotline: 09XX-XXX-XXXX',
      // Changed to Blue Theme (formerly Green)
      color: 'bg-blue-50 text-blue-600', 
      delay: 100
    },
    {
      icon: Mail,
      title: 'Email Us',
      content: 'barangay.ugong@valenzuela.gov.ph',
      subtext: 'Response within 24 hours',
      // Changed to Blue Theme (formerly Orange)
      color: 'bg-blue-50 text-blue-600', 
      delay: 200
    },
    {
      icon: Clock,
      title: 'Office Hours',
      content: 'Monday - Friday',
      subtext: '8:00 AM - 5:00 PM',
      // Changed to Blue Theme (formerly Purple)
      color: 'bg-blue-50 text-blue-600', 
      delay: 300
    }
  ];

  return (
    <section id="contact" className="py-24 bg-white relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-blue-950 mb-6 tracking-tight">
            Get in Touch
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            We're here to help. Visit our office or call our hotline for prompt service.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactInfo.map((info, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center"
            >
              {/* Icon Bubble */}
              <div className={`w-16 h-16 bg-blue-100 text-[#1E2A5E] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-900 group-hover:text-white transition-all duration-300`}>
                <info.icon className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-blue-950 mb-2">{info.title}</h3>
              <p className="text-slate-700 font-medium mb-1">{info.content}</p>
              <p className="text-slate-500 text-sm">{info.subtext}</p>
            </div>
          ))}
        </div>

        {/* Social Media Connect Bar */}
        <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-blue-900/20 text-center md:text-left">
                
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Connect with us online</h3>
                    <p className="text-blue-100">
                        Stay updated on announcements and programs through our social media.
                    </p>
                </div>

                <div className="flex gap-4">
                    <a 
                      href="https://www.facebook.com/barangayugongvalenzuelacity" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white text-blue-950 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-lg"
                    >
                        <Facebook className="w-5 h-5 text-blue-600" />
                        Facebook Page
                    </a>
                </div>

            </div>
        </div>

      </div>
    </section>
  );
};

export default Contact;