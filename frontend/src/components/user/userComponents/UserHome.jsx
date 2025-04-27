import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FaCalendarCheck,
  FaClock,
  FaMapMarkerAlt,
  FaHeart,
  FaRunning,
  FaTrophy,
  FaChartLine,
  FaRegCalendarAlt,
  FaThermometerHalf,
  FaWind,
  FaTint,
} from 'react-icons/fa';

const UserHome = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/user/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(response.data);
    } catch (error) {
      toast.error('Error fetching dashboard data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      },
    },
    exit: { opacity: 0 }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98
    }
  };

  const chartVariants = {
    hidden: { scaleY: 0 },
    visible: i => ({
      scaleY: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut'
      }
    })
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full"
        />
      </div>
    );
  }

  if (!userData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center p-8"
      >
        <h2 className="text-2xl text-gray-600">No data available</h2>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="p-6 space-y-6"
      >
        {/* Welcome Section with Weather Info */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-lg"
        >
          <div className="flex justify-between items-start">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {userData.name}! 👋
              </h1>
              <p className="text-indigo-100">Ready for another exciting game today?</p>
            </motion.div>
            {userData.weather && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-right"
              >
                <div className="flex items-center space-x-2">
                  <FaThermometerHalf className="text-2xl" />
                  <span className="text-2xl font-bold">{userData.weather.temp}°C</span>
                </div>
                <div className="flex items-center space-x-2 mt-2 text-sm">
                  <FaTint />
                  <span>{userData.weather.humidity}% Humidity</span>
                </div>
                {userData.weather.idealForSports && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-2 bg-green-400 bg-opacity-20 px-3 py-1 rounded-full text-sm"
                  >
                    Perfect for Sports! 🎾
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={itemVariants}
            className="bg-white p-6 rounded-xl shadow-md transform transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500">Total Bookings</h3>
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <FaCalendarCheck className="text-indigo-500 text-xl" />
              </motion.div>
            </div>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-gray-800"
            >
              {userData.activityStats.totalBookings}
            </motion.p>
          </motion.div>

          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={itemVariants}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500">Sports Played</h3>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FaRunning className="text-green-500 text-xl" />
              </motion.div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {userData.activityStats.sportsPlayed}
            </p>
          </motion.div>

          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={itemVariants}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500">Hours Played</h3>
              <motion.div
                animate={{ rotateY: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FaClock className="text-orange-500 text-xl" />
              </motion.div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {userData.activityStats.hoursPlayed}
            </p>
          </motion.div>

          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={itemVariants}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500">Favorite Game</h3>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FaTrophy className="text-yellow-500 text-xl" />
              </motion.div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {userData.activityStats.favoriteGame}
            </p>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming and Recent Bookings */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2"
          >
            {userData.upcomingBooking && (
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-md p-6 mb-6"
                whileHover={{ y: -5 }}
              >
                <h2 className="text-xl font-semibold mb-4">Upcoming Booking</h2>
                <motion.div
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {userData.upcomingBooking.venue}
                      </h3>
                      <div className="flex items-center mt-2 text-gray-600">
                        <FaRegCalendarAlt className="mr-2" />
                        <span>{new Date(userData.upcomingBooking.date).toLocaleDateString()}</span>
                        <FaClock className="ml-4 mr-2" />
                        <span>{userData.upcomingBooking.time}</span>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer"
                    >
                      View Details
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
              <motion.div className="space-y-4">
                <AnimatePresence>
                  {userData.recentBookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 4, backgroundColor: '#F9FAFB' }}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                    >
                      <div>
                        <h3 className="font-medium text-gray-800">{booking.venue}</h3>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <FaMapMarkerAlt className="mr-1" />
                          <span>{booking.sport}</span>
                          <span className="mx-2">•</span>
                          <FaClock className="mr-1" />
                          <span>{booking.time}</span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {new Date(booking.date).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Side Content */}
          <motion.div
            variants={itemVariants}
            className="space-y-6"
          >
            {/* Favorite Venues */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Favorite Venues</h2>
              <motion.div className="space-y-3">
                {userData.favoriteVenues.map((venue, index) => (
                  <motion.div
                    key={venue.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <FaHeart className="text-red-500 mr-2" />
                      </motion.div>
                      <span className="font-medium text-gray-800">{venue.name}</span>
                    </div>
                    <div className="flex items-center text-yellow-500">
                      <span className="text-sm mr-1">{venue.rating.toFixed(1)}</span>
                      <motion.span
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ⭐
                      </motion.span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Weekly Activity Chart */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Weekly Activity</h2>
              <div className="h-48 flex items-end justify-between px-2">
                {userData.weeklyActivity.data.map((height, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    variants={chartVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scaleY: 1.1 }}
                    className="w-8 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg"
                    style={{ height: `${height * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                {userData.weeklyActivity.labels.map((day, index) => (
                  <span key={index}>{day.slice(0, 3)}</span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserHome;