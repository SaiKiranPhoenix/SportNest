import React from 'react';
import { motion } from 'framer-motion';

const DashboardContent = () => {
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.section
        variants={itemVariants}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Welcome to SportNest 👋
        </h2>
        <p className="text-gray-600">
          Book your favorite sports facilities with ease. Get started by exploring available turfs or checking your bookings.
        </p>
      </motion.section>

      <motion.section
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-indigo-600 mb-2">Quick Book</h3>
          <p className="text-gray-600">Find and book a turf instantly</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-indigo-600 mb-2">My Activities</h3>
          <p className="text-gray-600">View your bookings and history</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-indigo-600 mb-2">Favorites</h3>
          <p className="text-gray-600">Access your saved turfs quickly</p>
        </motion.div>
      </motion.section>
    </motion.div>
  );
};

export default DashboardContent;