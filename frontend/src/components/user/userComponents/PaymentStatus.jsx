import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const PaymentStatus = ({ status, message, details, onClose, onRetry, isLoading, isStripeDown }) => {
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const renderIcon = () => {
    if (isLoading) {
      return <FaSpinner className="w-16 h-16 text-indigo-500 animate-spin" />;
    }
    if (isSuccess) {
      return <FaCheckCircle className="w-16 h-16 text-green-500" />;
    }
    return <FaTimesCircle className="w-16 h-16 text-red-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={!isLoading ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg p-6 max-w-md w-full"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="inline-block mb-4"
          >
            {renderIcon()}
          </motion.div>

          <h3 className={`text-xl font-semibold mb-2 ${
            isLoading ? 'text-indigo-600' : 
            isSuccess ? 'text-green-600' : 
            'text-red-600'
          }`}>
            {isLoading ? 'Processing Payment' :
             isSuccess ? 'Payment Successful' :
             'Payment Failed'}
          </h3>

          <p className="text-gray-600 mb-4">{message}</p>
          {details && (
            <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg">
              {details}
            </p>
          )}

          {isStripeDown && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                Alternative payment methods available:
              </p>
              <ul className="mt-2 text-sm text-yellow-700">
                <li>• PhonePe</li>
                <li>• Google Pay</li>
                <li>• Paytm</li>
                <li>• Cash at venue</li>
              </ul>
            </div>
          )}

          {!isLoading && (
            <div className="flex gap-3 justify-center">
              {isError && onRetry && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onRetry}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {isStripeDown ? 'Try Another Method' : 'Try Again'}
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isSuccess 
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {isSuccess ? 'View Booking' : 'Close'}
              </motion.button>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 space-y-2">
              <div className="h-2 bg-gray-200 rounded">
                <motion.div
                  className="h-full bg-indigo-500 rounded"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className="text-sm text-gray-500">Please wait while we process your payment...</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PaymentStatus;