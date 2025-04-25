import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [userBookings, setUserBookings] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'user') {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const [facilitiesRes, bookingsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/facilities', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/user/bookings', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setFacilities(facilitiesRes.data);
        setUserBookings(bookingsRes.data);
      } catch (error) {
        toast.error('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleBookFacility = async (facilityId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/bookings',
        { facilityId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Booking successful!');
      // Refresh bookings
      const response = await axios.get('http://localhost:5000/api/user/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserBookings(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">SportNest</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Available Facilities */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Available Facilities</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((facility) => (
                <div key={facility._id} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{facility.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{facility.description}</p>
                  <p className="text-gray-900 font-medium mt-2">₹{facility.price}/hour</p>
                  <button
                    onClick={() => handleBookFacility(facility._id)}
                    className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Your Bookings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Bookings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.facilityName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(booking.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;
