import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import SideBar from '../common/SideBar';
import {
  FaHome, FaRegCompass, FaCalendarCheck, FaHeart,
  FaCreditCard, FaStar, FaBell, FaUser, FaSignOutAlt
} from 'react-icons/fa';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [userBookings, setUserBookings] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'user') {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const [facilitiesRes, bookingsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/facilities', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/user/bookings', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setFacilities(facilitiesRes.data);
        setUserBookings(bookingsRes.data);
      } catch (error) {
        toast.error('Failed to fetch user data');
      } finally {
        // Add slight delay for smooth transition
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const menuItems = [
    { label: 'Home', icon: <FaHome />, to: '#' },
    { label: 'Explore Turfs', icon: <FaRegCompass />, to: '#' },
    { label: 'My Bookings', icon: <FaCalendarCheck />, to: '#' },
    { label: 'Book a Turf', icon: <FaCalendarCheck />, to: '#' },
    { label: 'Favorites', icon: <FaHeart />, to: '#' },
    { label: 'Payments', icon: <FaCreditCard />, to: '#' },
    { label: 'Reviews', icon: <FaStar />, to: '#' },
    { label: 'Notifications', icon: <FaBell />, to: '#' },
    { label: 'Profile', icon: <FaUser />, to: '#' },
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
          {/* Facilities Section */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl shadow p-6 mb-8"
          >
            <motion.h2
              variants={itemVariants}
              className="text-xl font-semibold text-slate-800 mb-6"
            >
              Available Facilities
            </motion.h2>
            
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((facility) => (
                <motion.div
                  key={facility._id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-slate-50 to-white"
                >
                  <h3 className="text-lg font-semibold text-indigo-700">{facility.name}</h3>
                  <p className="text-slate-600 mt-2 text-sm line-clamp-2">{facility.description}</p>
                  <p className="mt-3 font-semibold text-slate-800">₹{facility.price}/hour</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {}}
                    className="mt-4 w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
                  >
                    Book Now
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Bookings Section */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible" 
            className="bg-white rounded-xl shadow p-6"
          >
            <motion.h2
              variants={itemVariants}
              className="text-xl font-semibold text-slate-800 mb-6"
            >
              Your Bookings
            </motion.h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">Facility</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {userBookings.map((booking) => (
                    <motion.tr
                      key={booking._id}
                      variants={itemVariants}
                      whileHover={{ backgroundColor: "#f8fafc" }}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 text-slate-800">{booking.facilityName}</td>
                      <td className="px-6 py-4 text-slate-800">
                        {new Date(booking.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {booking.status}
                        </motion.span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
