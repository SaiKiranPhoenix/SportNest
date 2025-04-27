import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaCalendar, FaClock, FaMapMarkerAlt, FaPhone, 
  FaEnvelope, FaUser, FaTimes, FaMoneyBillWave,
  FaCreditCard, FaMobileAlt, FaStar } from 'react-icons/fa';
import { SiPhonepe, SiGooglepay, SiPatreon } from 'react-icons/si';

const getPaymentIcon = (method) => {
  switch (method?.toLowerCase()) {
    case 'cash': return FaMoneyBillWave;
    case 'card': return FaCreditCard;
    case 'phonepe': return SiPhonepe;
    case 'gpay': return SiGooglepay;
    case 'paytm': return SiPatreon;
    default: return FaMobileAlt;
  }
};

// Particle effect component
const Particles = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="relative"
  >
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-indigo-500 rounded-full"
        initial={{ 
          x: 0, 
          y: 0, 
          opacity: 0.8,
          scale: 1
        }}
        animate={{ 
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50,
          opacity: 0,
          scale: 0
        }}
        transition={{ 
          duration: 1,
          repeat: Infinity,
          repeatDelay: Math.random() * 2
        }}
      />
    ))}
    {children}
  </motion.div>
);

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [review, setReview] = useState({
    rating: 5,
    comment: ''
  });

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

  // Enhanced animations for booking cards
  const bookingCardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      rotateX: -15
    },
    visible: { 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    },
    hover: {
      scale: 1.02,
      y: -5,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 400
      }
    }
  };

  // Enhanced modal animations
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      rotateY: -15
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateY: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      rotateY: 15
    }
  };

  // Function to check if booking is past
  const isPastBooking = (booking) => {
    if (!booking?.date || !booking?.slot) return false;

    const bookingDate = new Date(booking.date);
    const now = new Date();
    
    // First check if the date is in the past
    if (bookingDate.toDateString() !== now.toDateString() && bookingDate < now) {
      return true;
    }

    // If it's today, check the time
    if (bookingDate.toDateString() === now.toDateString()) {
      const endTimeMatch = booking.slot.match(/(\d{2}):(\d{2})-/);
      if (!endTimeMatch) return false;

      const [hours, minutes] = [parseInt(endTimeMatch[1]), parseInt(endTimeMatch[2])];
      const slotEndTime = new Date(bookingDate);
      slotEndTime.setHours(hours, minutes, 0);
      
      return slotEndTime < now;
    }

    return false;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/turfs/${selectedBooking.turfId._id}/reviews`,
        review,
        { headers: { Authorization: token } }
      );
      toast.success('Review submitted successfully');
      setShowReviewModal(false);
      setReview({ rating: 5, comment: '' });
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const ReviewModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={() => setShowReviewModal(false)}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl p-6 w-full max-w-md relative"
      >
        <h3 className="text-xl font-semibold mb-4">Rate your experience</h3>
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReview(prev => ({ ...prev, rating: star }))}
                  className="text-2xl focus:outline-none"
                >
                  <FaStar 
                    className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'} 
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
            <textarea
              value={review.comment}
              onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="4"
              placeholder="Share your experience..."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
            >
              Submit Review
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative w-16 h-16"
        >
          <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full"></div>
          <div className="absolute inset-0 border-r-4 border-purple-500 rounded-full" style={{ transform: 'rotate(45deg)' }}></div>
          <div className="absolute inset-0 border-b-4 border-blue-500 rounded-full" style={{ transform: 'rotate(90deg)' }}></div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-6"
    >
      <motion.h2
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="text-2xl font-semibold text-gray-800 mb-6"
      >
        My Bookings
      </motion.h2>

      {bookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <Particles>
            <FaCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          </Particles>
          <h3 className="text-lg font-medium text-gray-900">No bookings yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            When you book a turf, your bookings will appear here.
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          <AnimatePresence>
            {bookings.map((booking) => {
              const PaymentIcon = getPaymentIcon(booking.paymentMethod);
              return (
                <motion.div
                  key={booking._id}
                  variants={bookingCardVariants}
                  whileHover="hover"
                  layout
                  className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 transform-gpu perspective-1000"
                >
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    <div className="space-y-3 w-full lg:w-2/3">
                      <motion.h3 
                        className="text-base sm:text-lg font-medium text-gray-900"
                        whileHover={{ scale: 1.02 }}
                      >
                        {booking.turfId.name}
                      </motion.h3>
                      
                      <div className="flex items-center text-xs sm:text-sm text-gray-500">
                        <FaMapMarkerAlt className="mr-2 flex-shrink-0" />
                        <span className="truncate">{booking.turfId.location}</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <FaCalendar className="mr-2 flex-shrink-0" />
                          {formatDate(booking.date)}
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <FaClock className="mr-2 flex-shrink-0" />
                          {booking.slot}
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <PaymentIcon className="mr-2 flex-shrink-0" />
                          {booking.paymentMethod || 'Cash'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </motion.span>

                      {isPastBooking(booking) && booking.status === 'confirmed' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowReviewModal(true);
                          }}
                          className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors"
                        >
                          Write Review
                        </motion.button>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowContactModal(booking)}
                            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            View Contact
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCancel(booking._id)}
                            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm p-4"
            onClick={() => setShowContactModal(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md transform-gpu"
              onClick={e => e.stopPropagation()}
            >
              <Particles>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Admin Contact Details</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowContactModal(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </motion.button>
                </div>
              </Particles>
              
              <div className="space-y-4 sm:space-y-6">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center p-2 sm:p-3 bg-gray-50 rounded-lg"
                >
                  <FaUser className="text-indigo-500 mr-3 text-lg sm:text-xl" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Name</p>
                    <p className="text-sm sm:text-base text-gray-900 font-medium">{showContactModal.adminContact.name}</p>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center p-2 sm:p-3 bg-gray-50 rounded-lg"
                >
                  <FaPhone className="text-indigo-500 mr-3 text-lg sm:text-xl" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                    <p className="text-sm sm:text-base text-gray-900 font-medium">{showContactModal.adminContact.phone}</p>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center p-2 sm:p-3 bg-gray-50 rounded-lg"
                >
                  <FaEnvelope className="text-indigo-500 mr-3 text-lg sm:text-xl" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Email</p>
                    <p className="text-sm sm:text-base text-gray-900 font-medium break-all">{showContactModal.adminContact.email}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showReviewModal && <ReviewModal />}
    </motion.div>
  );
};

export default MyBookings;