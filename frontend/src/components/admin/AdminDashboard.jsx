import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FaChartBar, FaFutbol, FaCalendarAlt, FaUsers, FaMoneyBillAlt,
  FaBullhorn, FaStarHalfAlt, FaBell, FaCog, FaLifeRing, FaSignOutAlt,
  FaPlusCircle, FaListAlt, FaUser
} from 'react-icons/fa';
import SideBar from '../common/SideBar';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
      navigate('/login');
    } else {
      setTimeout(() => setLoading(false), 500);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard', icon: <FaChartBar />, to: '/admin/dashboard' },
    { label: 'Add Turf', icon: <FaPlusCircle />, to: '/admin/add-turf' },
    { label: 'My Turfs', icon: <FaListAlt />, to: '/admin/my-turfs' },
    { label: 'Bookings', icon: <FaCalendarAlt />, to: '/admin/bookings' },
    { label: 'Reports', icon: <FaMoneyBillAlt />, to: '/admin/reports' },
    { label: 'Notifications', icon: <FaBell />, to: '/admin/notifications' },
    { label: 'Profile', icon: <FaUser />, to: '/admin/profile' },
    { label: 'Logout', icon: <FaSignOutAlt />, onClick: handleLogout },
  ];

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50"
      >
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full"
          />
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
            <div className="w-8 h-8 bg-primary-500 rounded-full opacity-30"></div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 animate-gradient">
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-white/30 pointer-events-none" />
      
      <SideBar
        brand={
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-2xl text-primary-600"
            >
              <FaFutbol />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              SportNest Admin
            </span>
          </motion.div>
        }
        menuItems={menuItems}
        className="bg-white/80 backdrop-blur-md shadow-lg border-r border-gray-100"
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 sm:px-6 md:px-8 max-w-[1600px] mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
