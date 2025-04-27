import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, FaFutbol, FaMoneyBillAlt, FaCalendarAlt,
  FaArrowUp, FaArrowDown, FaClock, FaChartBar
} from 'react-icons/fa';
import axios from 'axios';

const AdminDashboardContent = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalTurfs: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/admin/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setStats({
          totalBookings: response.data.totalBookings,
          totalRevenue: response.data.totalRevenue,
          activeUsers: response.data.activeUsers,
          totalTurfs: response.data.totalTurfs,
        });
        
        setRecentBookings(response.data.recentBookings);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const StatCard = ({ title, value, icon, trend }) => {
    const formatValue = () => {
      if (value === null || value === undefined) return '0';
      
      if (title === 'Total Revenue') {
        return `₹${Number(value).toLocaleString('en-IN', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 0
        })}`;
      }
      
      return Number(value).toLocaleString('en-IN');
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ 
          y: -5,
          transition: { duration: 0.2 }
        }}
        className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-lg border border-gray-100"
      >
        <motion.div
          className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {icon}
        </motion.div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {formatValue()}
            </h3>
          </div>
          <div className={`p-4 rounded-full ${
            title === 'Total Revenue' ? 'bg-green-100 text-green-600' :
            title === 'Total Bookings' ? 'bg-blue-100 text-blue-600' :
            title === 'Active Users' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
          }`}>
            {icon}
          </div>
        </div>
        {trend !== undefined && trend !== null && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex items-center"
          >
            {trend > 0 ? (
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FaArrowUp className="text-green-500 mr-1" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FaArrowDown className="text-red-500 mr-1" />
              </motion.div>
            )}
            <span className={`text-sm font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(trend)}% from last month
            </span>
          </motion.div>
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
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
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
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
            <div className="w-8 h-8 bg-indigo-500 rounded-full opacity-30"></div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl text-white shadow-lg"
      >
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-indigo-100 mt-1">Welcome back, Admin!</p>
        </div>
        <motion.div 
          className="flex items-center space-x-2 text-sm bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaClock className="text-indigo-200" />
          <span className="text-indigo-100">Last updated: {new Date().toLocaleTimeString()}</span>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={<FaCalendarAlt className="text-2xl" />}
          trend={12}
        />
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          icon={<FaMoneyBillAlt className="text-2xl" />}
          trend={8}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={<FaUsers className="text-2xl" />}
          trend={5}
        />
        <StatCard
          title="Total Turfs"
          value={stats.totalTurfs}
          icon={<FaFutbol className="text-2xl" />}
          trend={0}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Recent Bookings</h2>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"
            >
              <FaChartBar className="text-xl" />
            </motion.div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turf</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {recentBookings.map((booking, index) => (
                  <motion.tr 
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ backgroundColor: '#F9FAFB' }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white font-medium">
                          {booking.user.charAt(0).toUpperCase()}
                        </div>
                        <span className="ml-3 text-sm text-gray-900">{booking.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.turf}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(booking.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboardContent;