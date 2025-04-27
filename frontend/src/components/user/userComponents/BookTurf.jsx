import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaFilter, FaSort, FaHeart, FaCreditCard, FaMoneyBill, FaMobileAlt, FaWindowClose } from 'react-icons/fa';
import { SiPhonepe, SiGooglepay, SiPatreon } from 'react-icons/si';

const BookTurf = () => {
  const [turfs, setTurfs] = useState([]);
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Filter and sort states
  const [filters, setFilters] = useState({
    location: '',
    sport: '',
    minPrice: '',
    maxPrice: ''
  });
  const [sortConfig, setSortConfig] = useState({
    sortBy: '',
    sortOrder: 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const sports = [
    'Cricket',
    'Football',
    'Badminton',
    'Volleyball',
    'Basketball',
    'Tennis'
  ];

  const cities = [
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Ahmedabad',
    'Pune',
    'Jaipur',
    'Lucknow'
  ];

  // Animation variants
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

  useEffect(() => {
    // Initial fetch when component mounts
    fetchTurfs();
    fetchFavorites();
  }, []); // Empty dependency array for initial load

  useEffect(() => {
    // Only fetch when filters or sort changes if they have values
    if (Object.values(filters).some(value => value !== '') || sortConfig.sortBy) {
      fetchTurfs();
    }
  }, [filters, sortConfig]);

  const fetchTurfs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.location) params.append('location', filters.location);
      if (filters.sport) params.append('sport', filters.sport);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (sortConfig.sortBy) {
        params.append('sortBy', sortConfig.sortBy);
        params.append('sortOrder', sortConfig.sortOrder);
      }

      const response = await axios.get(`http://localhost:5000/turfs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTurfs(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch turfs');
      console.error('Error fetching turfs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/user/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Add null check before mapping
      setFavorites(new Set((response.data || []).map(turf => turf?._id).filter(Boolean)));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      // Initialize empty set on error
      setFavorites(new Set());
    }
  };

  const toggleFavorite = async (e, turfId) => {
    e.stopPropagation(); // Prevent turf selection when clicking heart
    try {
      const token = localStorage.getItem('token');
      if (favorites.has(turfId)) {
        await axios.delete(`http://localhost:5000/user/favorites/${turfId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(turfId);
          return newSet;
        });
        toast.success('Removed from favorites');
      } else {
        await axios.post(`http://localhost:5000/user/favorites/${turfId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => new Set([...prev, turfId]));
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update favorites');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSortChange = (field) => {
    setSortConfig(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const resetFilters = () => {
    setFilters({
      location: '',
      sport: '',
      minPrice: '',
      maxPrice: ''
    });
    setSortConfig({
      sortBy: '',
      sortOrder: 'asc'
    });
  };

  const timeSlots = [
    '06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00',
    '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
    '20:00-21:00'
  ];

  const fetchBookedSlots = async (turfId, date) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/bookings/slots/${turfId}`, {
        params: { date },
        headers: { Authorization: token }
      });
      setBookedSlots(response.data || []);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  useEffect(() => {
    if (selectedTurf && selectedDate) {
      fetchBookedSlots(selectedTurf._id, selectedDate);
    }
  }, [selectedTurf, selectedDate]);

  const handleInitiateBooking = () => {
    if (!selectedTurf || !selectedDate || !selectedSlot) {
      toast.error('Please select all booking details');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/bookings', {
        turfId: selectedTurf._id,
        date: selectedDate,
        slot: selectedSlot,
        paymentMethod: selectedPaymentMethod
      }, {
        headers: { Authorization: token }
      });
      
      if (response.data) {
        toast.success('Booking successful! You can view booking details in My Bookings');
        setShowPaymentModal(false);
        // Reset form
        setSelectedTurf(null);
        setSelectedDate('');
        setSelectedSlot('');
        setBookedSlots([]);
        setSelectedPaymentMethod('cash');
      }
    } catch (error) {
      if (error.response?.data?.message === 'This slot is already booked') {
        toast.error('This slot has just been booked by someone else. Please choose another slot.');
        setShowPaymentModal(false);
      } else {
        toast.error(error.response?.data?.message || 'Booking failed');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: FaMoneyBill, description: 'Pay at venue' },
    { id: 'phonepe', name: 'PhonePe', icon: SiPhonepe, description: 'UPI payment via PhonePe' },
    { id: 'gpay', name: 'Google Pay', icon: SiGooglepay, description: 'UPI payment via Google Pay' },
    { id: 'card', name: 'Card', icon: FaCreditCard, description: 'Credit/Debit Card' },
    { id: 'paytm', name: 'Paytm', icon: SiPatreon, description: 'Pay via Paytm Wallet/UPI' }
  ];

  const PaymentModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={() => !isProcessingPayment && setShowPaymentModal(false)}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative"
      >
        <div className="relative mb-6">
          <h3 className="text-2xl font-bold text-gray-800 text-center">Payment Method</h3>
          <button
            onClick={() => !isProcessingPayment && setShowPaymentModal(false)}
            className="absolute right-0 top-0 text-gray-400 hover:text-gray-600"
            disabled={isProcessingPayment}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <motion.button
                key={method.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPaymentMethod(method.id)}
                disabled={isProcessingPayment}
                className={`w-full p-4 rounded-lg border ${
                  selectedPaymentMethod === method.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                } flex items-center justify-between transition-all duration-200`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedPaymentMethod === method.id 
                      ? 'bg-indigo-100' 
                      : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      selectedPaymentMethod === method.id 
                        ? 'text-indigo-600' 
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                </div>
                {selectedPaymentMethod === method.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full border-2 border-indigo-500 flex items-center justify-center"
                  >
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-gray-600">Total Amount:</div>
            <div className="text-2xl font-bold text-gray-900">₹{selectedTurf?.price}</div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            disabled={isProcessingPayment}
            className={`w-full py-4 rounded-lg font-semibold text-white ${
              isProcessingPayment
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } transition-all duration-200 flex items-center justify-center gap-2`}
          >
            {isProcessingPayment ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {selectedPaymentMethod === 'cash' ? (
                  <span>Confirm Booking</span>
                ) : (
                  <>
                    <span>Pay ₹{selectedTurf?.price}</span>
                    <span>&</span>
                    <span>Book Now</span>
                  </>
                )}
              </>
            )}
          </motion.button>
          
          {selectedPaymentMethod !== 'cash' && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Secured by SSL 256-bit encryption
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <motion.h2
          variants={itemVariants}
          className="text-2xl font-semibold text-gray-800"
        >
          Book a Turf
        </motion.h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <FaFilter className="mr-2" />
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-white p-4 rounded-lg shadow-md mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Locations</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <select
                name="sport"
                value={filters.sport}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Sports</option>
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min ₹"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max ₹"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => handleSortChange('price')}
                className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <FaSort className="mr-2" />
                Sort by Price
                {sortConfig.sortBy === 'price' && (
                  <span className="ml-1">
                    {sortConfig.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Reset Filters
            </button>
          </div>
        </motion.div>
      )}

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {turfs.map((turf) => (
          <motion.div
            key={turf._id}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className={`bg-white rounded-lg border overflow-hidden transition-all duration-200 ${
              selectedTurf?._id === turf._id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300 hover:shadow-lg'
            }`}
          >
            <div className="relative">
              {turf.images && turf.images[0] && (
                <img
                  src={`http://localhost:5000${turf.images[0].path}`}
                  alt={turf.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <button
                onClick={(e) => toggleFavorite(e, turf._id)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200"
              >
                <FaHeart
                  className={`w-5 h-5 ${
                    favorites.has(turf._id)
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`}
                />
              </button>
            </div>
            <div className="p-4 cursor-pointer" onClick={() => setSelectedTurf(turf)}>
              <h3 className="text-lg font-semibold text-gray-800">{turf.name}</h3>
              <p className="text-gray-600 mt-2">{turf.location}</p>
              <div className="flex items-center justify-between mt-4">
                <p className="text-indigo-600 font-medium">₹{turf.price}/hour</p>
                <span className="text-sm text-gray-500">{turf.sport}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {selectedTurf && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-white rounded-lg shadow-lg"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Booking Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time Slot
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    disabled={bookedSlots.includes(slot)}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2 text-sm rounded-lg border ${
                      selectedSlot === slot
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : bookedSlots.includes(slot)
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-500'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInitiateBooking}
            className="mt-6 w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Confirm Booking
          </motion.button>
        </motion.div>
      )}

      {showPaymentModal && (
        <AnimatePresence>
          <PaymentModal />
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default BookTurf;