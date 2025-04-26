import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaFutbol, FaMoneyBillAlt, FaCalendarAlt,
  FaArrowUp, FaArrowDown, FaClock
} from 'react-icons/fa';

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
    // Simulated data - Replace with actual API calls
    setTimeout(() => {
      setStats({
        totalBookings: 156,
        totalRevenue: 15600,
        activeUsers: 89,
        totalTurfs: 12,
      });
      
      setRecentBookings([
        { id: 1, user: "John Doe", turf: "Green Field", time: "10:00 AM", date: "2025-04-26", status: "Confirmed" },
        { id: 2, user: "Jane Smith", turf: "Soccer Arena", time: "2:30 PM", date: "2025-04-26", status: "Pending" },
        { id: 3, user: "Mike Johnson", turf: "Sports Complex", time: "5:00 PM", date: "2025-04-26", status: "Confirmed" },
      ]);

      setIsLoading(false);
    }, 1000);
  }, []);

  const StatCard = ({ title, value, icon, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-2">
            {title === 'Total Revenue' ? `₹${value.toLocaleString()}` : value}
          </h3>
        </div>
        <div className={`p-3 rounded-full ${
          title === 'Total Revenue' ? 'bg-green-100' :
          title === 'Total Bookings' ? 'bg-blue-100' :
          title === 'Active Users' ? 'bg-purple-100' : 'bg-orange-100'
        }`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          {trend > 0 ? (
            <FaArrowUp className="text-green-500 mr-1" />
          ) : (
            <FaArrowDown className="text-red-500 mr-1" />
          )}
          <span className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {Math.abs(trend)}% from last month
          </span>
        </div>
      )}
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <FaClock />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={<FaCalendarAlt className="text-blue-500 text-xl" />}
          trend={12}
        />
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          icon={<FaMoneyBillAlt className="text-green-500 text-xl" />}
          trend={8}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={<FaUsers className="text-purple-500 text-xl" />}
          trend={5}
        />
        <StatCard
          title="Total Turfs"
          value={stats.totalTurfs}
          icon={<FaFutbol className="text-orange-500 text-xl" />}
          trend={0}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turf</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.turf}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.status === 'Confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardContent;