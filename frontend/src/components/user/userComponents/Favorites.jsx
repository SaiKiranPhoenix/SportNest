import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaHeart, FaMapMarkerAlt, FaRupeeSign } from 'react-icons/fa';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

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
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/user/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch favorite turfs');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (turfId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/user/favorites/${turfId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Removed from favorites');
      fetchFavorites(); // Refresh the list
    } catch (error) {
      toast.error('Failed to remove from favorites');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
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
          <h1 className="text-3xl font-bold">Favorite Turfs</h1>
          <p className="text-indigo-100 mt-1">Your favorite sports destinations</p>
        </div>
      </motion.div>

      {favorites.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <FaHeart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No favorite turfs yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start exploring and add turfs to your favorites!
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((turf) => (
            <motion.div
              key={turf._id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-lg border overflow-hidden transition-all duration-200 hover:border-indigo-300 hover:shadow-lg"
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
                  onClick={() => removeFavorite(turf._id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200"
                >
                  <FaHeart className="w-5 h-5 text-red-500" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">{turf.name}</h3>
                <div className="flex items-center text-gray-600 mt-2">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{turf.location}</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center text-indigo-600">
                    <FaRupeeSign className="mr-1" />
                    <span className="font-medium">{turf.price}/hour</span>
                  </div>
                  <span className="text-sm text-gray-500">{turf.sport}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Favorites;