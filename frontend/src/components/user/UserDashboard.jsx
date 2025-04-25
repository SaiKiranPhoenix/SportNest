import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SideBar from '../common/SideBar';
import {
  FaHome, FaRegCompass, FaCalendarCheck, FaHeart,
  FaCreditCard, FaStar, FaBell, FaUser, FaSignOutAlt
} from 'react-icons/fa';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'user') {
      navigate('/login');
      return;
    }
    // Short delay for smooth transition
    setTimeout(() => setLoading(false), 500);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const menuItems = [
    { label: 'Home', icon: <FaHome />, to: '/user/dashboard' },
    { label: 'Explore Turfs', icon: <FaRegCompass />, to: '/user/explore-turfs' },
    { label: 'My Bookings', icon: <FaCalendarCheck />, to: '/user/my-bookings' },
    { label: 'Book a Turf', icon: <FaCalendarCheck />, to: '/user/book-turf' },
    { label: 'Favorites', icon: <FaHeart />, to: '/user/favorites' },
    { label: 'Payments', icon: <FaCreditCard />, to: '/user/payments' },
    { label: 'Reviews', icon: <FaStar />, to: '/user/reviews' },
    { label: 'Notifications', icon: <FaBell />, to: '/user/notifications' },
    { label: 'Profile', icon: <FaUser />, to: '/user/profile' },
    { label: 'Logout', icon: <FaSignOutAlt />, onClick: handleLogout },
  ];

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-screen bg-slate-50"
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500 border-solid"></div>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-6 w-6 rounded-full bg-indigo-500"></div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SideBar
        brand={
          <motion.span
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-indigo-600"
          >
            SportNest
          </motion.span>
        }
        menuItems={menuItems}
        className="bg-white shadow-lg"
        footer={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-center text-gray-400"
          >
            &copy; {new Date().getFullYear()} SportNest
          </motion.div>
        }
      />

      <main className="pt-6 pb-8 md:pl-[280px] transition-all duration-300">
        <div className="px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
