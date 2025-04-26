import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  FaChartBar, FaFutbol, FaCalendarAlt, FaUsers, FaMoneyBillAlt,
  FaBullhorn, FaStarHalfAlt, FaBell, FaCog, FaLifeRing, FaSignOutAlt,
  FaPlusCircle, FaListAlt,
  FaUser
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
    { label: 'Dashboard', icon: <FaChartBar />, to: '/admin' },
    { label: 'Add Turf', icon: <FaPlusCircle />, to: '/admin/add-turf' },
    { label: 'My Turfs', icon: <FaListAlt />, to: '/admin/my-turfs' },
    { label: 'Bookings', icon: <FaCalendarAlt />, to: '/admin/bookings' },
    { label: 'Users', icon: <FaUsers />, to: '/admin/users' },
    { label: 'Reports', icon: <FaMoneyBillAlt />, to: '/admin/reports' },
    { label: 'Reviews', icon: <FaStarHalfAlt />, to: '/admin/reviews' },
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
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
