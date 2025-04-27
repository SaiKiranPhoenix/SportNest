import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaPhone, FaEnvelope, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
      setFilteredBookings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    filterBookings(term, filterStatus);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    filterBookings(searchTerm, status);
  };

  const filterBookings = (term, status) => {
    let filtered = bookings;

    if (term) {
      filtered = filtered.filter(booking =>
        booking.userName.toLowerCase().includes(term) ||
        booking.turfName.toLowerCase().includes(term)
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(booking => booking.status === status);
    }

    setFilteredBookings(filtered);
  };

  const handleSort = (criteria) => {
    setSortBy(criteria);
    const sorted = [...filteredBookings].sort((a, b) => {
      if (criteria === 'date') {
        return new Date(b.bookingDate) - new Date(a.bookingDate);
      }
      if (criteria === 'amount') {
        return b.amount - a.amount;
      }
      return 0;
    });
    setFilteredBookings(sorted);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/admin/bookings/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (response.data) {
        toast.success(`Booking ${newStatus} successfully`);
        fetchBookings();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handleDelete = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `http://localhost:5000/admin/bookings/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` }}
        );

        if (response.data) {
          toast.success('Booking deleted successfully');
          fetchBookings(); // Refresh the bookings list
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete booking');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl text-white shadow-lg mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold">Turf Bookings</h1>
          <p className="text-indigo-100 mt-1">Manage your turf bookings</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search and Filter Section */}
            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2 flex-1">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search by user or turf name..."
                className="w-full outline-none"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                <FaFilter className="mr-2" /> All
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFilterChange('pending')}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  filterStatus === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                Pending
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFilterChange('confirmed')}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  filterStatus === 'confirmed' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                Confirmed
              </motion.button>
            </div>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSort('date')}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  sortBy === 'date' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                <FaCalendarAlt className="mr-2" /> Sort by Date
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSort('amount')}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  sortBy === 'amount' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                Sort by Amount
              </motion.button>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Turf Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{booking._id.slice(-6)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{booking.userName}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <FaEnvelope className="mr-1" /> {booking.userEmail}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <FaPhone className="mr-1" /> {booking.userPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{booking.turfName}</div>
                        <div className="text-sm text-gray-500">{booking.turfLocation}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{booking.timeSlot}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{booking.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusChange(booking._id, 'confirmed')}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            disabled={booking.status === 'confirmed'}
                            title="Confirm booking"
                          >
                            <FaCheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking._id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            disabled={booking.status === 'cancelled'}
                            title="Cancel booking"
                          >
                            <FaTimesCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(booking._id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Delete booking"
                          >
                            <FaTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Bookings;