import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
} from 'react-icons/fa';

const UserHome = () => {
  const [userData, setUserData] = useState({
    name: '',
    recentBookings: [],
    upcomingBooking: null,
    favoriteVenues: [],
    activityStats: {
      totalBookings: 0,
      sportsPlayed: 0,
      favoriteGame: '',
      hoursPlayed: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    fetchUserData();
    // Simulated weather data
    setWeatherData({
      temp: 28,
      condition: 'Sunny',
      humidity: 65,
      idealForSports: true,
    });
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Simulated data - Replace with actual API calls
      setUserData({
        name: 'John',
        recentBookings: [
          {
            id: 1,
            venue: 'Green Field Arena',
            date: '2025-04-27',
            time: '10:00 AM',
            sport: 'Football',
          },
          {
            id: 2,
            venue: 'Sports Hub',
            date: '2025-04-28',
            time: '4:00 PM',
            sport: 'Cricket',
          },
        ],
        upcomingBooking: {
          venue: 'Tennis Court A',
          date: '2025-04-26',
          time: '6:00 PM',
          sport: 'Tennis',
        },
        favoriteVenues: [
          { id: 1, name: 'Green Field Arena', rating: 4.8 },
          { id: 2, name: 'Sports Hub', rating: 4.6 },
        ],
        activityStats: {
          totalBookings: 15,
          sportsPlayed: 4,
          favoriteGame: 'Football',
          hoursPlayed: 30,
        },
      });
    } catch (error) {
      toast.error('Error fetching user data');
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
      },
    },
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
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      {/* Welcome Section */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg"
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold mb-2"
        >
          Welcome back, {userData.name}! 👋
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-indigo-100"
        >
          Ready for another exciting game today?
        </motion.p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Total Bookings</h3>
            <FaCalendarCheck className="text-indigo-500 text-xl" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {userData.activityStats.totalBookings}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Sports Played</h3>
            <FaRunning className="text-green-500 text-xl" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {userData.activityStats.sportsPlayed}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Hours Played</h3>
            <FaClock className="text-orange-500 text-xl" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {userData.activityStats.hoursPlayed}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500">Favorite Game</h3>
            <FaTrophy className="text-yellow-500 text-xl" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {userData.activityStats.favoriteGame}
          </p>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Booking */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2"
        >
          {userData.upcomingBooking && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Upcoming Booking</h2>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {userData.upcomingBooking.venue}
                    </h3>
                    <div className="flex items-center mt-2 text-gray-600">
                      <FaRegCalendarAlt className="mr-2" />
                      <span>{userData.upcomingBooking.date}</span>
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
              </div>
            </div>
          )}

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
            <div className="space-y-4">
              {userData.recentBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  whileHover={{ x: 4 }}
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
                    {booking.date}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Side Content */}
        <motion.div
          variants={itemVariants}
          className="space-y-6"
        >
          {/* Weather Widget */}
          {weatherData && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Today's Weather</h2>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-800 mb-2">
                  {weatherData.temp}°C
                </div>
                <p className="text-gray-600">{weatherData.condition}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Humidity: {weatherData.humidity}%
                </p>
                {weatherData.idealForSports && (
                  <div className="mt-3 text-green-600 text-sm font-medium">
                    Perfect weather for sports! 🎾
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Favorite Venues */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Favorite Venues</h2>
            <div className="space-y-3">
              {userData.favoriteVenues.map((venue) => (
                <motion.div
                  key={venue.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center">
                    <FaHeart className="text-red-500 mr-2" />
                    <span className="font-medium text-gray-800">{venue.name}</span>
                  </div>
                  <div className="flex items-center text-yellow-500">
                    <span className="text-sm mr-1">{venue.rating}</span>
                    ⭐
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Activity Trend</h2>
            <div className="h-48 flex items-end justify-between px-2">
              {[0.6, 0.4, 0.8, 0.5, 0.7, 0.9, 0.6].map((height, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height * 100}%` }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.1,
                    ease: 'easeOut',
                  }}
                  className="w-8 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg"
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserHome;