import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Sports icons for the background
const sportsIcons = [
  '⚽', '🏀', '🎾', '⚾', '🏈', '🏉', '🎱', '🏓', '🏸', '⛳',
  '🏊', '🏃', '🚴', '🎯', '🎳', '🏹', '🥊', '🏸', '⚽', '🏀',
  '🎾', '⚾', '🏈', '🏉', '🎱', '🏓', '🏸', '⛳', '🏊', '🏃'
];

const FallingIcon = ({ icon, delay }) => {
  const randomX = Math.random() * 100;
  const duration = 3 + Math.random() * 2;

  return (
    <motion.div
      initial={{ y: -20, x: `${randomX}vw`, opacity: 0 }}
      animate={{
        y: '100vh',
        opacity: [0, 1, 1, 0],
        scale: [1, 1.2, 1],
        filter: [
          'drop-shadow(0 0 0px rgba(255,255,255,0))',
          'drop-shadow(0 0 20px rgba(255,255,255,0.8))',
          'drop-shadow(0 0 0px rgba(255,255,255,0))'
        ]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear'
      }}
      className="absolute text-2xl pointer-events-none"
    >
      {icon}
    </motion.div>
  );
};

const BackgroundAnimation = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {sportsIcons.map((icon, index) => (
        <FallingIcon
          key={index}
          icon={icon}
          delay={index * 0.5}
        />
      ))}
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role
      });
      
      toast.success('Registration successful!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 overflow-hidden py-12">
      <BackgroundAnimation />
      <motion.div
        initial={{ 
          x: location.state?.from === 'login' ? '100vw' : '-100vw',
          rotate: location.state?.from === 'login' ? 15 : -15,
          scale: 0.8,
          opacity: 0
        }}
        animate={{ 
          x: 0,
          rotate: 0,
          scale: 1,
          opacity: 1
        }}
        exit={{ 
          x: location.state?.from === 'login' ? '-100vw' : '100vw',
          rotate: location.state?.from === 'login' ? -15 : 15,
          scale: 0.8,
          opacity: 0
        }}
        transition={{ 
          duration: 0.5,
          type: "spring",
          stiffness: 300,
          damping: 25,
          mass: 0.8
        }}
        className="w-full max-w-md relative z-10"
      >
        <div
          className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-2xl perspective-1000"
          style={{ 
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden"
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-center text-2xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-1 text-center text-sm text-gray-600">
              Join us to book your favorite sports turf
            </p>
          </motion.div>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Type</label>
                  <div className="mt-1.5 flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={formData.role === 'user'}
                        onChange={handleChange}
                        className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                      />
                      <span className="ml-2 text-sm">User</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={formData.role === 'admin'}
                        onChange={handleChange}
                        className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                      />
                      <span className="ml-2 text-sm">Admin</span>
                    </label>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4"
            >
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Register'
                )}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center mt-2"
            >
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { from: 'register' } })}
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;