import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SideBar = ({ brand, menuItems, footer, className = '', mobileBreakpoint = 'md' }) => {
  const [open, setOpen] = useState(false);

  const sidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
    },
    closed: {
      x: "-100%",
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    }
  };

  const menuItemVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    closed: {
      x: -20,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: {
        duration: 0.3
      }
    },
    closed: {
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed top-4 left-4 z-50 ${mobileBreakpoint}:hidden p-2.5 rounded-lg bg-white shadow-lg`}
        onClick={() => setOpen(!open)}
        aria-label="Toggle sidebar"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <motion.span 
            animate={{ 
              rotate: open ? 45 : 0,
              y: open ? 8 : 0
            }}
            className="block w-6 h-0.5 bg-gray-800 transform-gpu transition-transform duration-200"
          />
          <motion.span 
            animate={{ 
              opacity: open ? 0 : 1,
              x: open ? -20 : 0
            }}
            className="block w-6 h-0.5 bg-gray-800 transition-all duration-200"
          />
          <motion.span 
            animate={{ 
              rotate: open ? -45 : 0,
              y: open ? -8 : 0
            }}
            className="block w-6 h-0.5 bg-gray-800 transform-gpu transition-transform duration-200"
          />
        </div>
      </motion.button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 bg-black/30 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          x: open ? 0 : window.innerWidth >= 768 ? 0 : "-100%",
          opacity: 1
        }}
        className={`fixed top-0 left-0 h-full w-[280px] bg-white shadow-xl z-40
          ${className}`}
      >
        {/* Brand/logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center h-16 border-b"
        >
          {brand}
        </motion.div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item, idx) => (
            item.onClick ? (
              <motion.button
                key={idx}
                initial={false}
                whileHover={{ x: 4, backgroundColor: "#f3f4f6" }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center w-full px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
                onClick={() => {
                  item.onClick();
                  if (window.innerWidth < 768) setOpen(false);
                }}
              >
                {item.icon && (
                  <motion.span 
                    className="mr-3 text-gray-600"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {item.icon}
                  </motion.span>
                )}
                <span className="text-gray-700 font-medium">{item.label}</span>
              </motion.button>
            ) : (
              <Link
                key={idx}
                to={item.to}
                className="flex items-center w-full px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
                onClick={() => {
                  if (window.innerWidth < 768) setOpen(false);
                }}
              >
                <motion.div
                  initial={false}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center w-full"
                >
                  {item.icon && (
                    <motion.span 
                      className="mr-3 text-gray-600"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      {item.icon}
                    </motion.span>
                  )}
                  <span className="text-gray-700 font-medium">{item.label}</span>
                </motion.div>
              </Link>
            )
          ))}
        </nav>

        {/* Footer */}
        {footer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-0 w-full p-4 border-t"
          >
            {footer}
          </motion.div>
        )}
      </motion.aside>
    </>
  );
};

SideBar.propTypes = {
  brand: PropTypes.node,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      to: PropTypes.string,
      onClick: PropTypes.func,
    })
  ).isRequired,
  footer: PropTypes.node,
  className: PropTypes.string,
  mobileBreakpoint: PropTypes.string,
};

export default SideBar;
