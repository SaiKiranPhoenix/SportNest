import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// Register and Login components
const Register = lazy(() => import('./components/auth/Register'));
const Login = lazy(() => import('./components/auth/Login'));

// Dashboard components
const UserDashboard = lazy(() => import('./components/user/UserDashboard'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

// Admin components
const AddTurf = lazy(() => import('./components/admin/adminComponents/AddTurf'));
const MyTurfs = lazy(() => import('./components/admin/adminComponents/MyTurfs'));
const AdminProfile = lazy(() => import('./components/admin/adminComponents/AdminProfile'));
const AdminDashboardContent = lazy(() => import('./components/admin/adminComponents/AdminDashboardContent'));
const Bookings = lazy(() => import('./components/admin/adminComponents/Bookings'));

// User components
const UserHome = lazy(() => import('./components/user/userComponents/UserHome'));
// const ExploreTurfs = lazy(() => import('./components/user/userComponents/ExploreTurfs'));
const MyBookings = lazy(() => import('./components/user/userComponents/MyBookings'));
const BookTurf = lazy(() => import('./components/user/userComponents/BookTurf'));
const Favorites = lazy(() => import('./components/user/userComponents/Favorites'));
const Payments = lazy(() => import('./components/user/userComponents/Payments'));
const Reviews = lazy(() => import('./components/user/userComponents/Reviews'));
const Notifications = lazy(() => import('./components/user/userComponents/Notifications'));
const Profile = lazy(() => import('./components/user/userComponents/Profile'));

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please try refreshing the page</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-indigo-500"></div>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <ErrorBoundary key={location.pathname}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            
            {/* User Routes */}
            <Route path="/user/*" element={
              <ProtectedRoute allowedRole="user">
                <UserDashboard />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" />} />
              <Route path="dashboard" element={<UserHome />} />
              {/* <Route path="explore-turfs" element={<ExploreTurfs />} /> */}
              <Route path="my-bookings" element={<MyBookings />} />
              <Route path="book-turf" element={<BookTurf />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="payments" element={<Payments />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" />} />
              <Route path="dashboard" element={<AdminDashboardContent />} />
              <Route path="add-turf" element={<AddTurf />} />
              <Route path="my-turfs" element={<MyTurfs />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <ToastContainer position="top-right" autoClose={3000} />
          <AnimatedRoutes />
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
