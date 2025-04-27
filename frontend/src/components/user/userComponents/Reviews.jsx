import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaStar, FaFilter, FaSort } from 'react-icons/fa';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [filters, setFilters] = useState({
    rating: '',
    sort: 'recent'
  });

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/turfs/reviews?sort=${filters.sort}${filters.rating ? `&rating=${filters.rating}` : ''}`,
        { headers: { Authorization: token } }
      );
      setReviews(response.data.reviews);
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const getStarColor = (rating, index) => {
    return index < rating ? 'text-yellow-400' : 'text-gray-300';
  };

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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto p-6"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl text-white shadow-lg mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold">My Reviews</h1>
          <p className="text-indigo-100 mt-1">View and manage your turf reviews</p>
        </div>
      </motion.div>

      {/* Rating Statistics */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-md p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Overall Rating</h3>
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold text-gray-900">
                {stats.average.toFixed(1)}
              </div>
              <div className="flex mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`w-6 h-6 ${getStarColor(Math.round(stats.average), star - 1)}`}
                  />
                ))}
              </div>
              <div className="text-gray-500 mb-1">
                ({stats.total} reviews)
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <div className="w-12 text-sm text-gray-600">
                    {rating} star{rating !== 1 ? 's' : ''}
                  </div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(stats.distribution[rating] / stats.total) * 100}%` 
                      }}
                      className="h-full bg-yellow-400"
                    />
                  </div>
                  <div className="w-12 text-sm text-gray-600 text-right">
                    {stats.distribution[rating]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Sort */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap gap-4 mb-6"
      >
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-500" />
          <select
            value={filters.rating}
            onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map(rating => (
              <option key={rating} value={rating}>{rating} Stars</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <FaSort className="text-gray-500" />
          <select
            value={filters.sort}
            onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="recent">Most Recent</option>
            <option value="rating-high">Highest Rating</option>
            <option value="rating-low">Lowest Rating</option>
          </select>
        </div>
      </motion.div>

      {/* Reviews List */}
      <AnimatePresence>
        {reviews.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="text-center py-12"
          >
            <FaStar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No reviews yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your reviews will appear here after you review a turf
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <motion.div
                key={review._id}
                variants={itemVariants}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {review.turf.name}
                    </h3>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={`w-5 h-5 ${getStarColor(review.rating, star - 1)}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(review.date).toLocaleDateString()}
                  </div>
                </div>
                <p className="mt-4 text-gray-600">{review.comment}</p>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Reviews;