import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  FaChartBar, FaFutbol, FaCalendarAlt, FaUsers, FaMoneyBillAlt,
  FaBullhorn, FaStarHalfAlt, FaBell, FaCog, FaLifeRing, FaSignOutAlt
} from 'react-icons/fa';
import SideBar from '../common/SideBar';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
      navigate('/login');
    } else {
      // Simulate loading delay for smooth transition
      setTimeout(() => setLoading(false), 500);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard', icon: <FaChartBar />, to: '#' },
    { label: 'Manage Turfs', icon: <FaFutbol />, to: '#' },
    { label: 'Slot Management', icon: <FaCalendarAlt />, to: '#' },
    { label: 'Bookings', icon: <FaCalendarAlt />, to: '#' },
    { label: 'Users', icon: <FaUsers />, to: '#' },
    { label: 'Payments & Reports', icon: <FaMoneyBillAlt />, to: '#' },
    { label: 'Promotions', icon: <FaBullhorn />, to: '#' },
    { label: 'Reviews', icon: <FaStarHalfAlt />, to: '#' },
    { label: 'Notifications', icon: <FaBell />, to: '#' },
    { label: 'Settings', icon: <FaCog />, to: '#' },
    { label: 'Support Tickets', icon: <FaLifeRing />, to: '#' },
    { label: 'Logout', icon: <FaSignOutAlt />, onClick: handleLogout },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

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
    <div className="min-h-screen bg-slate-50">
      <SideBar
        brand={
          <motion.span
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-indigo-600"
          >
            SportNest Admin
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
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl shadow p-6"
          >
            <motion.h2 
              variants={itemVariants}
              className="text-2xl font-semibold text-slate-800 mb-6"
            >
              Welcome Admin 👋
            </motion.h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <p className="text-sm text-indigo-600 font-medium">Total Bookings</p>
                <p className="text-2xl font-bold text-indigo-900">1,234</p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <p className="text-sm text-indigo-600 font-medium">Revenue</p>
                <p className="text-2xl font-bold text-indigo-900">₹5.6L</p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <p className="text-sm text-indigo-600 font-medium">Users</p>
                <p className="text-2xl font-bold text-indigo-900">875</p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <p className="text-sm text-indigo-600 font-medium">Active Turfs</p>
                <p className="text-2xl font-bold text-indigo-900">12</p>
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl shadow p-6 mt-8"
          >
            <motion.h3
              variants={itemVariants} 
              className="text-lg font-semibold text-slate-800"
            >
              Recent Activity
            </motion.h3>
            <motion.p 
              variants={itemVariants}
              className="text-slate-600 mt-2"
            >
              Your content goes here...
            </motion.p>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
