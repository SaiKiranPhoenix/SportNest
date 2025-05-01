import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaFilter, FaSort, FaHeart, FaCreditCard, FaMoneyBill, FaMobileAlt, FaWindowClose } from 'react-icons/fa';
import { SiPhonepe, SiGooglepay, SiPatreon } from 'react-icons/si';
import PaymentStatus from './PaymentStatus';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

// Initialize Stripe with the publishable key
const stripePromise = loadStripe('pk_test_51RJtl9PDfNjd9eEFcgsP5hRysiIUQb1dQvda1FBOAeHgw2MuYwihTKTLp4uRJmHacvPQRqU9WPqlGmYW1HNFqa4Y00WurC2vY4');

const CardPaymentForm = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsProcessing(true);

    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.');
      setIsProcessing(false);
      return;
    }

    try {
      // First confirm payment intent
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-confirmation',
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        setError(paymentError.message);
        onError(paymentError);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      } else {
        setError('Payment not completed. Please try again.');
        onError(new Error('Payment not completed'));
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="p-4 border border-gray-300 rounded-md">
        <PaymentElement />
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`mt-4 w-full py-2 px-4 rounded-md text-white font-medium ${
          isProcessing
            ? 'bg-indigo-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
            />
            Processing...
          </div>
        ) : (
          'Pay Now'
        )}
      </button>
    </form>
  );
};

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
  const [paymentIntentId, setPaymentIntentId] = useState(null); // Add state for payment intent
  const [paymentStatus, setPaymentStatus] = useState({
    show: false,
    status: '',
    message: '',
    details: ''
  });

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
    // Reset payment intent when opening modal
    setPaymentIntentId(null);
  };

  // Function to create a payment intent for card payments
  const createPaymentIntent = async () => {
    try {
      if (!selectedTurf?.price || !selectedTurf?._id || !selectedDate || !selectedSlot) {
        throw new Error('Missing required booking details');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to continue');
      }

      // Format date for consistency
      const formattedDate = new Date(selectedDate).toISOString();

      const response = await axios.post(
        'http://localhost:5000/create-payment-intent',
        {
          amount: selectedTurf.price,
          turfId: selectedTurf._id,
          date: formattedDate,
          slot: selectedSlot
        },
        {
          headers: { 
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.data || !response.data.paymentIntentId) {
        console.error('Invalid payment intent response:', response.data);
        throw new Error('Failed to initialize payment. Please try again.');
      }

      return {
        paymentIntentId: response.data.paymentIntentId,
        clientSecret: response.data.clientSecret
      };
    } catch (error) {
      if (error.response?.status === 503 && error.response?.data?.isStripeDown) {
        // Handle Stripe connection error specifically
        setPaymentStatus({
          show: true,
          status: 'error',
          message: 'Card payment unavailable',
          details: 'Card payment system is temporarily unavailable. Please try an alternative payment method.',
          isStripeDown: true
        });
        // Automatically switch to a different payment method
        setSelectedPaymentMethod('phonepe');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 401) {
        throw new Error('Please login again to continue');
      } else if (error.response?.status === 400) {
        throw new Error(error.response?.data?.details || 'Invalid booking details');
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Payment initialization failed. Please try again.');
      }
    }
  };

  // Update handlePayment function to properly handle Stripe payments
  const handlePayment = async () => {
    // Validate all required fields
    if (!selectedTurf?._id || !selectedDate || !selectedSlot || !selectedPaymentMethod) {
      toast.error('Please ensure all booking details are filled');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPaymentStatus({
          show: true,
          status: 'error',
          message: 'Authentication required',
          details: 'Please login to continue'
        });
        return;
      }

      // Format date for consistency
      const formattedDate = new Date(selectedDate).toISOString();

      if (selectedPaymentMethod === 'card') {
        try {
          // First create a payment intent
          const response = await axios.post(
            'http://localhost:5000/create-payment-intent',
            {
              amount: selectedTurf.price,
              turfId: selectedTurf._id,
              date: formattedDate,
              slot: selectedSlot
            },
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.data?.clientSecret) {
            throw new Error('Failed to initialize payment');
          }

          // Load Stripe.js
          const stripe = await loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
          if (!stripe) {
            throw new Error('Failed to load payment system');
          }

          // Confirm card payment
          const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
            response.data.clientSecret,
            {
              payment_method: {
                card: elements.getElement(CardElement),
                billing_details: {
                  name: 'User Name', // You might want to get this from your user context
                },
              },
            }
          );

          if (stripeError) {
            throw new Error(stripeError.message);
          }

          // If payment successful, create booking
          if (paymentIntent.status === 'succeeded') {
            const bookingData = {
              turfId: selectedTurf._id,
              date: formattedDate,
              slot: selectedSlot,
              paymentMethod: 'card',
              paymentIntentId: paymentIntent.id
            };

            const bookingResponse = await axios.post('http://localhost:5000/bookings', bookingData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (bookingResponse.data) {
              setPaymentStatus({
                show: true,
                status: 'success',
                message: 'Your booking has been confirmed!',
                details: `Booking ID: ${bookingResponse.data.booking._id}`
              });
              handleBookingSuccess();
            }
          }
        } catch (error) {
          console.error('Payment processing error:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Payment failed';
          const errorDetails = error.response?.data?.details || 'Please try again or choose a different payment method';
          setPaymentStatus({
            show: true,
            status: 'error',
            message: errorMessage,
            details: errorDetails
          });
          
          if (error.response?.status === 503) {
            // Handle Stripe service unavailability
            setSelectedPaymentMethod('phonepe');
          }
        }
      } else {
        // Handle other payment methods
        const bookingData = {
          turfId: selectedTurf._id,
          date: formattedDate,
          slot: selectedSlot,
          paymentMethod: selectedPaymentMethod
        };

        const response = await axios.post('http://localhost:5000/bookings', bookingData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data) {
          setPaymentStatus({
            show: true,
            status: 'success',
            message: 'Booking confirmed successfully!',
            details: selectedPaymentMethod === 'cash' 
              ? 'Please pay at the venue'
              : `Please complete the payment using ${selectedPaymentMethod.toUpperCase()}`
          });
          handleBookingSuccess();
        }
      }
    } catch (error) {
      handleBookingError(error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Helper function to handle booking success
  const handleBookingSuccess = () => {
    setShowPaymentModal(false);
    setSelectedTurf(null);
    setSelectedDate('');
    setSelectedSlot('');
    setBookedSlots([]);
    setSelectedPaymentMethod('cash');
    setPaymentIntentId(null);
  };

  // Helper function to handle booking errors
  const handleBookingError = (error) => {
    if (error.response?.data?.message === 'This slot is already booked') {
      setPaymentStatus({
        show: true,
        status: 'error',
        message: 'Slot no longer available',
        details: 'This slot has just been booked by someone else. Please choose another slot.'
      });
      setShowPaymentModal(false);
      // Refresh booked slots
      if (selectedTurf && selectedDate) {
        fetchBookedSlots(selectedTurf._id, selectedDate);
      }
    } else if (error.response?.status === 400) {
      setPaymentStatus({
        show: true,
        status: 'error',
        message: error.response.data.message || 'Invalid booking details',
        details: error.response.data.details || 'Please check your booking details and try again'
      });
    } else if (error.response?.status === 401) {
      setPaymentStatus({
        show: true,
        status: 'error',
        message: 'Session expired',
        details: 'Please login again to continue'
      });
    } else {
      setPaymentStatus({
        show: true,
        status: 'error',
        message: 'Booking failed',
        details: 'Please try again later'
      });
    }
  };

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: FaMoneyBill, description: 'Pay at venue' },
    { id: 'phonepe', name: 'PhonePe', icon: SiPhonepe, description: 'UPI payment via PhonePe' },
    { id: 'gpay', name: 'Google Pay', icon: SiGooglepay, description: 'UPI payment via Google Pay' },
    { id: 'card', name: 'Card', icon: FaCreditCard, description: 'Credit/Debit Card' },
    { id: 'paytm', name: 'Paytm', icon: SiPatreon, description: 'Pay via Paytm Wallet/UPI' }
  ];

  const PaymentModal = () => {
    const [clientSecret, setClientSecret] = useState(null);
  
    useEffect(() => {
      if (selectedPaymentMethod === 'card') {
        createPaymentIntent().then(
          ({ clientSecret }) => setClientSecret(clientSecret)
        ).catch(error => {
          console.error('Error creating payment intent:', error);
          toast.error('Failed to initialize payment system');
        });
      }
    }, [selectedPaymentMethod]);
  
    const handlePaymentSuccess = (paymentIntent) => {
      handlePayment();
    };
  
    const handlePaymentError = (error) => {
      setPaymentStatus({
        show: true,
        status: 'error',
        message: 'Payment failed',
        details: error.message || 'Please try again or choose a different payment method'
      });
    };
  
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-filter backdrop-blur-sm overflow-y-auto"
        onClick={() => !isProcessingPayment && setShowPaymentModal(false)}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative mx-4 my-8"
        >
          <div className="relative mb-8">
            <h3 className="text-2xl font-bold text-gray-800 text-center">Choose Payment Method</h3>
            <button
              onClick={() => !isProcessingPayment && setShowPaymentModal(false)}
              className="absolute -right-2 -top-2 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-md transition-all duration-200 hover:shadow-lg"
              disabled={isProcessingPayment}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
  
          <div className="space-y-4 mb-8">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <motion.button
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  disabled={isProcessingPayment}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 transform ${
                    selectedPaymentMethod === method.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                  } flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                      selectedPaymentMethod === method.id 
                        ? 'bg-indigo-100' 
                        : 'bg-gray-100 group-hover:bg-indigo-50'
                    }`}>
                      <Icon className={`w-6 h-6 transition-colors duration-200 ${
                        selectedPaymentMethod === method.id 
                          ? 'text-indigo-600' 
                          : 'text-gray-600 group-hover:text-indigo-500'
                      }`} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{method.name}</p>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                  </div>
                  {selectedPaymentMethod === method.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full border-2 border-indigo-500 flex items-center justify-center bg-white"
                    >
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
  
          <div className="border-t border-gray-200 pt-6">
            {selectedPaymentMethod === 'card' && clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CardPaymentForm
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div className="text-gray-600">Total Amount:</div>
                  <div className="text-3xl font-bold text-gray-900">₹{selectedTurf?.price}</div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                  className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg ${
                    isProcessingPayment
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl'
                  } transition-all duration-200 flex items-center justify-center gap-3`}
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
                        <div className="flex items-center gap-2">
                          <span>Pay ₹{selectedTurf?.price}</span>
                          <span>&</span>
                          <span>Book Now</span>
                        </div>
                      )}
                    </>
                  )}
                </motion.button>
              </>
            )}
            
            {selectedPaymentMethod !== 'cash' && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm text-gray-500">
                  Secured by SSL 256-bit encryption
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const handleRetryPayment = () => {
    setPaymentStatus({ show: false, status: '', message: '', details: '' });
    setShowPaymentModal(true);
  };

  const handleClosePaymentStatus = () => {
    setPaymentStatus({ show: false, status: '', message: '', details: '' });
    if (paymentStatus.status === 'success') {
      // Navigate to bookings page or show booking details
      // You can implement this based on your routing setup
    }
  };

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
    <>
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

      {paymentStatus.show && (
        <PaymentStatus
          status={paymentStatus.status}
          message={paymentStatus.message}
          details={paymentStatus.details}
          onClose={handleClosePaymentStatus}
          onRetry={handleRetryPayment}
        />
      )}
    </>
  );
};

export default BookTurf;
