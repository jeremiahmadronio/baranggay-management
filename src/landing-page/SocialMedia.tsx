import React from 'react';
import { motion } from 'framer-motion';

export const SocialMedia = () => {
  const socialWindows = [
    {
      name: 'Barangay\nFacebook', // \n for line break like in image
      url: 'https://facebook.com/barangayugong',
      image: '/facebook-landing.png', // Local image from public folder
      delay: 0.1
    },
    {
      name: 'Barangay\nInstagram',
      url: 'https://instagram.com/barangay_ugong',
      image: '/insta-landing.png', // Local image from public folder
      delay: 0.2
    },
    {
      name: 'SK\nFacebook',
      url: 'https://facebook.com/skugong',
      image: '/sk-facebook.png', // Local image from public folder
      delay: 0.3
    },
    {
      name: 'SK\nInstagram',
      url: 'https://instagram.com/skugong',
      image: '/sk-inta.png', // Local image from public folder
      delay: 0.4
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-8">
        
        {/* HEADER SECTION - Exact replica of the reference */}
        <div className="flex flex-col items-center mb-12">
          {/* Blue Line on Top */}
          <div className="w-16 h-1 mb-6" style={{ backgroundColor: '#1E2A5E' }} />
          
          {/* Title - Serif Font, Dark Blue */}
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-blue-950 text-center">
            Social Media Windows
          </h2>
        </div>

        {/* WINDOWS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {socialWindows.map((item, index) => (
            <motion.a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: item.delay }}
              className="group relative aspect-[1.15/1] sm:aspect-[1.1/1] md:aspect-[1/1] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 min-h-[200px] sm:min-h-[260px] md:min-h-[320px] max-w-[420px] w-full mx-auto"
            >
              {/* Background Image */}
              <img 
                src={item.image} 
                alt={item.name.replace('\n', ' ')}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Dark Overlay - Essential for White Text readability */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

              {/* Text Content - Centered & White */}
              <div className="absolute inset-0 flex items-center justify-center p-6 md:p-8">
                <h3 className="text-white text-2xl md:text-3xl font-bold text-center leading-tight drop-shadow-md whitespace-pre-line">
                  {item.name}
                </h3>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialMedia;