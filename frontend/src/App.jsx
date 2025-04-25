import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import { Suspense, lazy } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const Register = lazy(() => import('./components/auth/Register'));
const Login = lazy(() => import('./components/auth/Login'));
const UserDashboard = lazy(() => import('./components/user/UserDashboard'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AddTurf = lazy(() => import('./components/admin/adminComponents/AddTurf'));

// Import user components
const ExploreTurfs = lazy(() => import('./components/user/userComponents/ExploreTurfs'));
const MyBookings = lazy(() => import('./components/user/userComponents/MyBookings'));
const BookTurf = lazy(() => import('./components/user/userComponents/BookTurf'));
const Favorites = lazy(() => import('./components/user/userComponents/Favorites'));
const Payments = lazy(() => import('./components/user/userComponents/Payments'));
const Reviews = lazy(() => import('./components/user/userComponents/Reviews'));
const Notifications = lazy(() => import('./components/user/userComponents/Notifications'));
const Profile = lazy(() => import('./components/user/userComponents/Profile'));
const DashboardContent = lazy(() => import('./components/user/userComponents/DashboardContent'));

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

const preloadComponents = () => {
  const components = [Register, Login, UserDashboard, AdminDashboard, AddTurf];
  components.forEach(component => {
    component.preload?.();
  });
};

preloadComponents();

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={null} key={location.pathname}>
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
            <Route path="dashboard" element={<DashboardContent />} />
            <Route path="explore-turfs" element={<ExploreTurfs />} />
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
            <Route path="dashboard" element={<DashboardContent />} />
            <Route path="add-turf" element={<AddTurf />} />
          </Route>
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <ToastContainer position="top-right" autoClose={3000} />
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;
