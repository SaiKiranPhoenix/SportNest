import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';
import { FaChartLine, FaChartBar, FaChartPie, FaCalendarAlt, FaFilter } from 'react-icons/fa';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [timeframe, setTimeframe] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchReportData();
  }, [timeframe]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch overview data
      const overviewResponse = await axios.get(
        `http://localhost:5000/admin/reports/overview?timeframe=${timeframe}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch detailed stats
      const detailedResponse = await axios.get(
        `http://localhost:5000/admin/reports/detailed?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReportData(overviewResponse.data);
      setDetailedStats(detailedResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-2" style={{ color }}>
            {typeof value === 'number' && title.toLowerCase().includes('revenue') 
              ? `₹${value.toLocaleString()}`
              : value.toLocaleString()}
          </h3>
        </div>
        <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 1, repeat: Infinity, ease: "linear" },
            scale: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={reportData.overview.totalRevenue}
          icon={<FaChartLine className="w-6 h-6 text-blue-500" />}
          color="#0088FE"
        />
        <StatCard
          title="Total Bookings"
          value={reportData.overview.totalBookings}
          icon={<FaCalendarAlt className="w-6 h-6 text-green-500" />}
          color="#00C49F"
        />
        <StatCard
          title="Confirmed Bookings"
          value={reportData.overview.confirmedBookings}
          icon={<FaChartBar className="w-6 h-6 text-yellow-500" />}
          color="#FFBB28"
        />
        <StatCard
          title="Average Booking Value"
          value={Math.round(reportData.overview.averageBookingValue)}
          icon={<FaChartPie className="w-6 h-6 text-purple-500" />}
          color="#8884D8"
        />
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-6 rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold mb-4">Revenue Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={Object.entries(reportData.revenueByDay).map(([date, value]) => ({ date, value }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#0088FE" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Revenue by Turf */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white p-6 rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold mb-4">Revenue by Turf</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={Object.entries(reportData.revenueByTurf).map(([name, value]) => ({ name, value }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#00C49F">
              {Object.entries(reportData.revenueByTurf).map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-xl font-semibold mb-4">Customer Locations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(reportData.customerInsights.locations).map(([name, value]) => ({ name, value }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {Object.entries(reportData.customerInsights.locations).map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-xl font-semibold mb-4">Sport Preferences</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(reportData.customerInsights.preferences).map(([name, value]) => ({ name, value }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {Object.entries(reportData.customerInsights.preferences).map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );

  const renderDetailedTab = () => (
    <AnimatePresence>
      {detailedStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-8"
        >
          {/* Peak Hours Analysis */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Peak Hours Analysis</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={Object.entries(detailedStats.peakHours).map(([hour, count]) => ({ hour, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8">
                  {Object.entries(detailedStats.peakHours).map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Seasonal Trends */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Seasonal Revenue Trends</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={Object.entries(detailedStats.seasonalTrends).map(([month, revenue]) => ({
                month: new Date(2024, month).toLocaleString('default', { month: 'long' }),
                revenue
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sport Type Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Sport Type Distribution</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={Object.entries(detailedStats.sportTypeBreakdown).map(([sport, count]) => ({ sport, count }))}
                  dataKey="count"
                  nameKey="sport"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label
                >
                  {Object.entries(detailedStats.sportTypeBreakdown).map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl text-white shadow-lg mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-indigo-100 mt-1">View insights and performance metrics</p>
        </div>
        
        <div className="flex gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:ring-2 focus:ring-white/20"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:ring-2 focus:ring-white/20"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>
      </motion.div>

      <div className="flex gap-4 border-b">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'detailed'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('detailed')}
        >
          Detailed Analysis
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mt-6"
        >
          {activeTab === 'overview' ? renderOverviewTab() : renderDetailedTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Reports;