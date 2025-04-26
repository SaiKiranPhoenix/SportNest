import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaCalendar, FaClock, FaMapMarkerAlt, FaPhone, 
  FaEnvelope, FaUser, FaTimes 
} from 'react-icons/fa';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/bookings/history', {
        headers: { Authorization: token }
      });
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: token }
      });
      
      setBookings(bookings.map(booking =>
        booking._id === bookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      ));
      toast.success('Booking cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const ContactModal = ({ booking, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Admin Contact Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <FaUser className="text-gray-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-gray-900">{booking.adminContact.name}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <FaPhone className="text-gray-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-900">{booking.adminContact.phone}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <FaEnvelope className="text-gray-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{booking.adminContact.email}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">My Bookings</h2>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <FaCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No bookings yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            When you book a turf, your bookings will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {bookings.map((booking) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg shadow-sm border p-4"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {booking.turfId.name}
                    </h3>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <FaMapMarkerAlt className="mr-2" />
                      {booking.turfId.location}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendar className="mr-2" />
                        {formatDate(booking.date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FaClock className="mr-2" />
                        {booking.slot}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>

                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => setShowContactModal(booking)}
                          className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          View Contact
                        </button>
                        <button
                          onClick={() => handleCancel(booking._id)}
                          className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showContactModal && (
          <ContactModal
            booking={showContactModal}
            onClose={() => setShowContactModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyBookings;