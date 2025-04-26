import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

const BookTurf = () => {
  const [turfs, setTurfs] = useState([]);
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookedSlots, setBookedSlots] = useState([]);

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
    const fetchTurfs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/turfs', {
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

    fetchTurfs();
  }, []);

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

  const timeSlots = [
    '06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00',
    '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
    '20:00-21:00'
  ];

  const handleBooking = async () => {
    if (!selectedTurf || !selectedDate || !selectedSlot) {
      toast.error('Please select all booking details');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/bookings', {
        turfId: selectedTurf._id,
        date: selectedDate,
        slot: selectedSlot
      }, {
        headers: { Authorization: token }
      });
      
      if (response.data.adminContact) {
        toast.success('Booking successful! You can view admin contact details in My Bookings');
      }
      
      // Reset form
      setSelectedTurf(null);
      setSelectedDate('');
      setSelectedSlot('');
      setBookedSlots([]);
    } catch (error) {
      if (error.response?.data?.message === 'This slot is already booked') {
        toast.error('This slot has just been booked by someone else. Please choose another slot.');
      } else {
        toast.error(error.response?.data?.message || 'Booking failed');
      }
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500 border-solid"></div>
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
            <div className="h-6 w-6 rounded-full bg-indigo-500"></div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto py-6"
    >
      <motion.h2
        variants={itemVariants}
        className="text-2xl font-semibold text-gray-800 mb-6"
      >
        Book a Turf
      </motion.h2>

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
            className={`rounded-lg border p-6 cursor-pointer transition-all duration-200 ${
              selectedTurf?._id === turf._id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300 hover:shadow-lg'
            }`}
            onClick={() => setSelectedTurf(turf)}
          >
            {turf.images && turf.images[0] && (
              <div 
                className="h-48 bg-cover bg-center rounded-lg mb-4"
                style={{ backgroundImage: `url(http://localhost:5000${turf.images[0].path})` }}
              />
            )}
            <h3 className="text-lg font-semibold text-gray-800">{turf.name}</h3>
            <p className="text-gray-600 mt-2">{turf.location}</p>
            <div className="flex items-center justify-between mt-4">
              <p className="text-indigo-600 font-medium">₹{turf.price}/hour</p>
              <span className="text-sm text-gray-500">{turf.sport}</span>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            onClick={handleBooking}
            className="mt-6 w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Confirm Booking
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BookTurf;