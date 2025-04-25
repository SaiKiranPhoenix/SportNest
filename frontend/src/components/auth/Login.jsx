import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      toast.success('Login successful!');
      
      // Redirect based on user role
      if (response.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-transparent overflow-hidden">
      <motion.div
        initial={{ 
          x: location.state?.from === 'register' ? '100vw' : '-100vw',
          rotate: location.state?.from === 'register' ? 15 : -15,
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
          x: location.state?.from === 'register' ? '-100vw' : '100vw',
          rotate: location.state?.from === 'register' ? -15 : 15,
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
        className="w-full max-w-md"
      >
        <div
          className="bg-white p-6 rounded-xl shadow-lg perspective-1000"
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
              Welcome back
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to book your favorite sports turf
            </p>
          </motion.div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="john@example.com"
                />
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
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
                  'Sign in'
                )}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register', { state: { from: 'login' } })}
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Sign up
                </button>
              </p>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
