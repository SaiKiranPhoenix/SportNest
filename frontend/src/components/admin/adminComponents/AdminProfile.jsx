import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaSave, FaEdit, FaCamera, FaKey, FaTrash } from 'react-icons/fa';

const AdminProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    profilePicture: null
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/profile', {
        headers: {
          'Authorization': token
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching profile: ' + error.message);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/profile', {
        method: 'PUT',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Error updating profile: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/profile/picture', {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const data = await response.json();
      setProfile(prev => ({
        ...prev,
        profilePicture: data
      }));
      toast.success('Profile picture updated successfully');
    } catch (error) {
      toast.error('Error uploading profile picture: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/profile/change-password', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      toast.success('Password updated successfully');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/profile', {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      localStorage.removeItem('token');
      localStorage.removeItem('role');
      toast.success('Account deleted successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const PasswordModal = () => (
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
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-xl font-semibold mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
            >
              Update Password
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );

  const DeleteModal = () => (
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
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-xl font-semibold mb-4">Delete Account</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete your account? This action cannot be undone and will:
          <ul className="list-disc ml-6 mt-2">
            <li>Delete all your turfs</li>
            <li>Remove all your bookings</li>
            <li>Delete your profile permanently</li>
          </ul>
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Delete Account
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Admin Profile</h2>
            {!isEditing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEditClick}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaEdit className="mr-2" />
                <span>Edit Profile</span>
              </motion.button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Profile picture section */}
          <div className="flex flex-col items-center mb-8">
            <div 
              className="relative group cursor-pointer mb-4"
              onClick={handleProfilePictureClick}
            >
              {profile.profilePicture ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative w-32 h-32 rounded-full overflow-hidden"
                >
                  <img
                    src={`http://localhost:5000${profile.profilePicture.path}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaCamera className="text-white text-2xl" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center"
                >
                  <FaUser className="text-gray-400 text-4xl" />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <FaCamera className="text-white text-2xl" />
                  </div>
                </motion.div>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleProfilePictureChange}
            />
            <p className="text-sm text-gray-500">
              Click to {profile.profilePicture ? 'change' : 'add'} profile picture
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`pl-10 w-full px-4 py-2 border ${
                      isEditing 
                        ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                        : 'border-gray-200 bg-gray-50'
                    } rounded-md transition-colors ${
                      !isEditing ? 'cursor-not-allowed' : ''
                    }`}
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 cursor-not-allowed"
                    placeholder="Your email"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <FaPhone />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`pl-10 w-full px-4 py-2 border ${
                      isEditing 
                        ? 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' 
                        : 'border-gray-200 bg-gray-50'
                    } rounded-md transition-colors ${
                      !isEditing ? 'cursor-not-allowed' : ''
                    }`}
                    placeholder="Your phone number"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end space-x-3"
              >
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className={`flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    updating ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  <FaSave />
                  <span>{updating ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </motion.div>
            )}

            <div className="border-t pt-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaKey className="mr-2" />
                  Change Password
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center justify-center px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FaTrash className="mr-2" />
                  Delete Account
                </motion.button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPasswordModal && <PasswordModal />}
        {showDeleteModal && <DeleteModal />}
      </AnimatePresence>
    </div>
  );
};

export default AdminProfile;