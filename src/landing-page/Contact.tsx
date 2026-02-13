import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Send, MessageCircle } from 'lucide-react';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    alert('Salamat! Natanggap na namin ang iyong mensahe.');
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Address',
      content: '3S Center, Barangay Ugong, Valenzuela City',
      subtext: 'Near Ugong Health Station'
    },
    {
      icon: Phone,
      title: 'Telepono',
      content: '(02) 8292-XXXX',
      subtext: 'Hotline: 09XX-XXX-XXXX'
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'barangay.ugong@valenzuela.gov.ph',
      subtext: 'Response within 24 hours'
    },
    {
      icon: Clock,
      title: 'Oras ng Opisina',
      content: 'Lunes - Biyernes',
      subtext: '8:00 AM - 5:00 PM'
    }
  ];

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
            Makipag-ugnayan
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
            Contact Us
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            May katanungan o kailangan ng tulong? Huwag mag-atubiling 
            makipag-ugnayan sa aming tanggapan.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Impormasyon ng Opisina</h3>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{info.title}</h4>
                      <p className="text-gray-700">{info.content}</p>
                      <p className="text-sm text-gray-500">{info.subtext}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4">Follow Us</h4>
                <div className="flex gap-3">
                  <a 
                    href="https://www.facebook.com/barangayugongvalenzuelacity" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition"
                  >
                    <Facebook className="w-6 h-6" />
                  </a>
                  <a 
                    href="#" 
                    className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center hover:bg-green-700 transition"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="mt-6 bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="h-64 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                  <p className="text-blue-600 font-medium">3S Center Location</p>
                  <p className="text-sm text-blue-500">Barangay Ugong, Valenzuela City</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Magpadala ng Mensahe</h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pangalan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Juan Dela Cruz"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="09XX-XXX-XXXX"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="juan@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paksa <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Pumili ng paksa...</option>
                    <option value="inquiry">General Inquiry</option>
                    <option value="complaint">Complaint / Reklamo</option>
                    <option value="request">Document Request</option>
                    <option value="feedback">Feedback / Suggestion</option>
                    <option value="emergency">Emergency Report</option>
                    <option value="other">Iba pa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensahe <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Isulat ang iyong mensahe dito..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Ipadala ang Mensahe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
