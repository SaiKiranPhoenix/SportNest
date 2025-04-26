import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaTimes, FaWarehouse } from 'react-icons/fa';

const MyTurfs = () => {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    name: '',
    location: '',
    sport: '',
    price: '',
    description: '',
    address: ''
  });

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

  useEffect(() => {
    fetchTurfs();
  }, []);

  const fetchTurfs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/admin/turfs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTurfs(response.data);
    } catch (error) {
      toast.error('Failed to fetch turfs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = (turf) => {
    setSelectedTurf(turf);
    setUpdateFormData({
      name: turf.name,
      location: turf.location,
      sport: turf.sport,
      price: turf.price,
      description: turf.description,
      address: turf.address
    });
    setShowUpdateModal(true);
  };

  const handleDetailsClick = (turf) => {
    setSelectedTurf(turf);
    setShowDetailsModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/turfs/${selectedTurf._id}`,
        updateFormData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Turf updated successfully');
      setShowUpdateModal(false);
      fetchTurfs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update turf');
    }
  };

  const handleDelete = async (turfId) => {
    if (window.confirm('Are you sure you want to delete this turf?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/turfs/${turfId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Turf deleted successfully');
        fetchTurfs();
      } catch (error) {
        toast.error('Failed to delete turf');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Modal Components
  const UpdateModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Update Turf</h2>
          <button
            onClick={() => setShowUpdateModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={updateFormData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <select
                name="location"
                value={updateFormData.location}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select a city</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sport</label>
              <select
                name="sport"
                value={updateFormData.sport}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select a sport</option>
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
              <input
                type="number"
                name="price"
                value={updateFormData.price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={updateFormData.address}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={updateFormData.description}
                onChange={handleInputChange}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={() => setShowUpdateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );

  const DetailsModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{selectedTurf.name}</h2>
          <button
            onClick={() => setShowDetailsModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          {selectedTurf.images && selectedTurf.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedTurf.images.map((image, index) => (
                <img
                  key={index}
                  src={`http://localhost:5000${image.path}`}
                  alt={`Turf ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              <p className="mt-1">{selectedTurf.location}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Sport</h3>
              <p className="mt-1">{selectedTurf.sport}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Price per Hour</h3>
              <p className="mt-1">₹{selectedTurf.price}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="mt-1">{selectedTurf.address}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1">{selectedTurf.description}</p>
          </div>

          {selectedTurf.reviews && selectedTurf.reviews.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Reviews</h3>
              <div className="space-y-2">
                {selectedTurf.reviews.map((review, index) => (
                  <div key={index} className="border-l-4 border-indigo-500 pl-4">
                    <div className="flex items-center">
                      <div className="flex text-yellow-400">
                        {[...Array(review.rating)].map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">My Turfs</h2>

      {turfs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-[60vh] text-gray-400"
        >
          <FaWarehouse className="w-24 h-24 mb-4" />
          <h3 className="text-xl font-medium mb-2">No turfs added yet</h3>
          <p className="text-gray-500">Start by adding your first turf using the "Add Turf" option.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turfs.map((turf) => (
            <motion.div
              key={turf._id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div
                className="h-48 bg-cover bg-center cursor-pointer"
                style={{
                  backgroundImage: turf.images && turf.images[0]
                    ? `url(http://localhost:5000${turf.images[0].path})`
                    : 'none'
                }}
                onClick={() => handleDetailsClick(turf)}
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">{turf.name}</h3>
                <p className="text-gray-600">{turf.location}</p>
                <p className="text-indigo-600 font-medium mt-2">₹{turf.price}/hour</p>
                
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => handleUpdateClick(turf)}
                    className="p-2 text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(turf._id)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUpdateModal && <UpdateModal />}
        {showDetailsModal && selectedTurf && <DetailsModal />}
      </AnimatePresence>
    </div>
  );
};

export default MyTurfs;