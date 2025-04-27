import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddTurf = () => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    sport: '',
    price: '',
    description: '',
    address: '', // Added address field
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const generateTimeSlots = () => {
    const slots = [];
    // Generate slots from 6 AM to 9 PM
    for (let hour = 6; hour <= 21; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`,
        isBooked: false
      });
    }
    return slots;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedImages.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    if (!formData.sport) {
      toast.error('Please select a sport');
      return;
    }
    
    setLoading(true);

    try {
      // Create availability for the next 30 days
      const availability = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        availability.push({
          date,
          slots: generateTimeSlots()
        });
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('sport', formData.sport);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('address', formData.address); // Added address field
      
      // Append each image file
      selectedImages.forEach(image => {
        formDataToSend.append('images', image);
      });

      // Append availability as JSON string
      formDataToSend.append('availability', JSON.stringify(availability));

      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/turfs', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Turf added successfully!');
      
      // Clear form and previews
      setFormData({
        name: '',
        location: '',
        sport: '',
        price: '',
        description: '',
        address: '', // Added address field reset
      });
      setSelectedImages([]);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add turf');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl text-white shadow-lg mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold">Add New Turf</h1>
          <p className="text-indigo-100 mt-1">Create a new turf listing</p>
        </div>
      </motion.div>

      <motion.form
        variants={containerVariants}
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
      >
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Turf Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter turf name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">Select a city</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter complete address"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sport
            </label>
            <select
              name="sport"
              required
              value={formData.sport}
              onChange={handleChange}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">Select a sport</option>
              {sports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per Hour (₹)
            </label>
            <input
              type="number"
              name="price"
              required
              min="0"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter price per hour"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter turf description"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images (Maximum 5)
          </label>
          <div className="mt-1 space-y-3">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-4 pb-5">
                  <svg className="w-6 h-6 mb-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="text-sm text-gray-500"><span className="font-medium">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 5MB each)</p>
                </div>
                <input 
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={selectedImages.length >= 5}
                />
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="pt-2 flex justify-end"
        >
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 text-white font-medium rounded-lg ${
              loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
            } transition-colors duration-200 flex items-center justify-center min-w-[120px]`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 0 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Add Turf'
            )}
          </button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
};

export default AddTurf;