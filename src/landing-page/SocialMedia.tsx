import { motion } from 'framer-motion';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  MessageCircle,
  ExternalLink,
  Heart,
  Users,
  Share2
} from 'lucide-react';

export const SocialMedia = () => {
  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      handle: '@BarangayUgongOfficial',
      url: 'https://facebook.com/barangayugong',
      followers: '12.5K',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      description: 'Mga updates, announcements, at news tungkol sa Barangay Ugong',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      handle: '@barangay_ugong',
      url: 'https://instagram.com/barangay_ugong',
      followers: '5.2K',
      color: 'from-pink-500 via-purple-500 to-orange-500',
      bgColor: 'bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500',
      hoverColor: 'hover:opacity-90',
      description: 'Behind the scenes at community highlights ng ating barangay',
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      handle: '@BrgyUgong',
      url: 'https://twitter.com/brgyugong',
      followers: '2.8K',
      color: 'from-gray-800 to-black',
      bgColor: 'bg-gray-900',
      hoverColor: 'hover:bg-black',
      description: 'Quick updates at real-time announcements',
    },
    {
      name: 'YouTube',
      icon: Youtube,
      handle: 'Barangay Ugong TV',
      url: 'https://youtube.com/@barangayugongtv',
      followers: '1.5K',
      color: 'from-red-500 to-red-700',
      bgColor: 'bg-red-600',
      hoverColor: 'hover:bg-red-700',
      description: 'Video coverage ng mga events at programs ng barangay',
    },
    {
      name: 'Messenger',
      icon: MessageCircle,
      handle: 'Barangay Ugong Help',
      url: 'https://m.me/barangayugong',
      followers: '24/7',
      color: 'from-blue-400 to-purple-600',
      bgColor: 'bg-gradient-to-r from-blue-500 to-purple-600',
      hoverColor: 'hover:opacity-90',
      description: 'Direct messaging para sa mga inquiry at assistance',
    },
  ];

  const recentPosts = [
    {
      platform: 'Facebook',
      icon: Facebook,
      content: '🎉 Maligayang araw sa ating mga Senior Citizens! Ang Medical Mission ay magaganap sa...',
      likes: 234,
      shares: 45,
      time: '2 hours ago',
      color: 'text-blue-600',
    },
    {
      platform: 'Instagram',
      icon: Instagram,
      content: '📸 Highlights from yesterday\'s Youth Development Program! Thank you sa lahat ng...',
      likes: 456,
      shares: 89,
      time: '5 hours ago',
      color: 'text-pink-600',
    },
    {
      platform: 'Twitter',
      icon: Twitter,
      content: '⚠️ ADVISORY: Road repair along Main Street. Expect delays from 8AM-5PM today.',
      likes: 67,
      shares: 123,
      time: '8 hours ago',
      color: 'text-gray-900',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section id="social" className="py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-100 rounded-full blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-blue-100 text-pink-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Share2 className="w-4 h-4" />
            Connect With Us
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Stay <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600">Connected</span>
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Follow us on social media para sa mga pinakabagong updates, 
            announcements, at happenings sa Barangay Ugong.
          </p>
        </motion.div>

        {/* Social Platforms Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {socialPlatforms.map((platform) => (
            <motion.a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group block"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 ${platform.bgColor} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <platform.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 group-hover:text-blue-600 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{platform.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{platform.handle}</p>
                <p className="text-sm text-gray-600 mb-4">{platform.description}</p>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{platform.followers}</span>
                    <span className="text-xs text-gray-500">followers</span>
                  </div>
                  <span className={`text-sm font-medium bg-gradient-to-r ${platform.color} bg-clip-text text-transparent group-hover:underline`}>
                    Follow →
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Recent Posts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Recent Updates
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {recentPosts.map((post, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-3">
                  <post.icon className={`w-5 h-5 ${post.color}`} />
                  <span className="text-sm font-medium text-gray-900">{post.platform}</span>
                  <span className="text-xs text-gray-400 ml-auto">{post.time}</span>
                </div>

                {/* Post Content */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {post.content}
                </p>

                {/* Post Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="w-4 h-4" />
                    {post.shares}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-8 sm:p-12 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-2xl" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Join Our Online Community!
                </h3>
                <p className="text-white/80 max-w-lg">
                  Be part of our growing community. Get exclusive updates, participate 
                  in discussions, and stay connected with fellow residents.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <a 
                  href="https://facebook.com/groups/barangayugong" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-purple-50 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                >
                  <Facebook className="w-5 h-5" />
                  Join FB Group
                </a>
                <a 
                  href="https://m.me/barangayugong"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 backdrop-blur border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Message Us
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating Social Icons - Fixed Position Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500">
            💡 Tip: You can also find our social media links in the footer below
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialMedia;
