import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Users, 
  TrendingUp, 
  Smartphone,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Secure Banking',
    description: 'Your funds are protected with bank-level security and encryption.',
  },
  {
    icon: Users,
    title: 'Community Focused',
    description: 'Built for village savings groups and community banking needs.',
  },
  {
    icon: TrendingUp,
    title: 'Track Growth',
    description: 'Monitor your savings and investments with detailed analytics.',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Access your account anytime, anywhere on any device.',
  },
]

const benefits = [
  'Easy group savings management',
  'Transparent transaction history',
  'Automated interest calculations',
  'Secure member management',
  'Real-time notifications',
  'Detailed financial reports',
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Banking Made Simple for Your Community
              </h1>
              <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-lg">
                Empower your village savings group with modern, secure, and easy-to-use 
                banking solutions designed for communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center bg-white text-primary-700 font-semibold py-3 px-8 rounded-lg hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="bg-white/20 rounded-lg p-4">
                    <p className="text-sm text-primary-200">Total Savings</p>
                    <p className="text-3xl font-bold">$24,500.00</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/20 rounded-lg p-4">
                      <p className="text-sm text-primary-200">Members</p>
                      <p className="text-2xl font-bold">48</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4">
                      <p className="text-sm text-primary-200">Growth</p>
                      <p className="text-2xl font-bold text-green-300">+12%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help your community manage savings effectively.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Wise Village Banking?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We understand the unique needs of community savings groups. Our platform 
                is built from the ground up to serve village banking operations.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 text-white"
            >
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-primary-100 mb-6">
                Join thousands of communities already using Wise Village Banking 
                to manage their savings effectively.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center bg-white text-primary-700 font-semibold py-3 px-6 rounded-lg hover:bg-primary-50 transition-all duration-200"
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
