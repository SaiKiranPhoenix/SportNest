import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCreditCard, FaMoneyBill, FaWindowClose } from 'react-icons/fa';
import { SiPhonepe, SiGooglepay, SiPatreon } from 'react-icons/si';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const paymentMethodIcons = {
    'card': FaCreditCard,
    'cash': FaMoneyBill,
    'phonepe': SiPhonepe,
    'gpay': SiGooglepay,
    'paytm': SiPatreon
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/user/payments', {
        headers: { Authorization: token }
      });
      setPayments(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch payment history');
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const PaymentDetailModal = ({ payment, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">Payment Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaWindowClose className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Transaction ID</span>
            <span className="font-medium">{payment.transactionId}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Amount</span>
            <span className="font-medium">₹{payment.amount}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Payment Method</span>
            <div className="flex items-center gap-2">
              {paymentMethodIcons[payment.paymentMethod] && 
                React.createElement(paymentMethodIcons[payment.paymentMethod], {
                  className: "w-5 h-5"
                })}
              <span className="capitalize">{payment.paymentMethod}</span>
            </div>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Status</span>
            <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(payment.status)}`}>
              {payment.status}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Date</span>
            <span>{formatDate(payment.date)}</span>
          </div>
          {payment.turf && (
            <>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Turf</span>
                <span>{payment.turf.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Slot</span>
                <span>{payment.slot}</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Payment History</h2>
        <p className="text-gray-600 mt-1">View all your payment transactions</p>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No payment history found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr
                    key={payment._id}
                    onClick={() => setSelectedPayment(payment)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {paymentMethodIcons[payment.paymentMethod] && 
                          React.createElement(paymentMethodIcons[payment.paymentMethod], {
                            className: "w-4 h-4"
                          })}
                        <span className="capitalize">{payment.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.transactionId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};

export default Payments;