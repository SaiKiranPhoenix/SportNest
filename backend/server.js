require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());
app.use(cors());

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Schema Definitions
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    phone: String,
    profilePicture: {
        filename: String,
        path: String
    },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }]
});

const turfSchema = new mongoose.Schema({
    name: String,
    location: {
        type: String,
        enum: ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow'],
        required: true
    },
    address: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sport: {
        type: String,
        enum: ['Cricket', 'Football', 'Badminton', 'Volleyball', 'Basketball', 'Tennis'],
        required: true
    },
    price: Number,
    description: String,
    images: [{ 
        filename: String,
        path: String 
    }],
    availability: [{
        date: Date,
        slots: [{
            time: String,
            isBooked: { type: Boolean, default: false }
        }]
    }],
    reviews: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: Number,
        comment: String,
        date: { type: Date, default: Date.now }
    }],
    averageRating: { type: Number, default: 0 }
});

// Add notification schema
const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    turfId: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf' },
    type: { type: String, enum: ['booking', 'cancellation', 'review'], required: true },
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Update booking schema to include payment method
const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    turfId: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf' },
    date: Date,
    slot: String,
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    bookingDate: { type: Date, default: Date.now },
    paymentMethod: { 
        type: String, 
        enum: ['cash', 'card', 'phonepe', 'gpay', 'paytm'],
        default: 'cash'
    },
    adminContact: {
        name: String,
        phone: String,
        email: String
    }
});

// After other schema definitions
const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  turfId: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'card', 'phonepe', 'gpay', 'paytm'],
    required: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending'
  },
  transactionId: String,
  date: { type: Date, default: Date.now },
  metadata: Object
});

const Payment = mongoose.model('Payment', paymentSchema);

const User = mongoose.model('User', userSchema);
const Turf = mongoose.model('Turf', turfSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ 
            message: 'Access denied',
            details: 'No authorization token provided'
        });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(403).json({ 
            message: 'Invalid token',
            details: 'Please login again to continue'
        });
    }
};

// Add retry function at the top of the file after the imports
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (error.type === 'StripeConnectionError') {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
};

// Update createPaymentIntent endpoint with better error handling and offline mode
app.post('/create-payment-intent', authenticateToken, async (req, res) => {
    try {
      const { amount, turfId, date, slot } = req.body;
      
      // Input validation
      if (!amount || !turfId || !date || !slot) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          details: 'Please provide amount, turfId, date, and slot'
        });
      }

      // Validate date format
      const bookingDate = new Date(date);
      if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ 
          message: 'Invalid date format',
          details: 'Please provide a valid date'
        });
      }
      
      // Check if slot is already booked
      const existingBooking = await Booking.findOne({
        turfId,
        date: bookingDate,
        slot,
        status: 'confirmed'
      });
  
      if (existingBooking) {
        return res.status(400).json({ 
          message: 'This slot is already booked',
          details: 'Please select a different time slot'
        });
      }

      // Verify the turf exists and get its price
      const turf = await Turf.findById(turfId);
      if (!turf) {
        return res.status(404).json({ 
          message: 'Turf not found',
          details: 'The selected turf does not exist'
        });
      }

      // Verify amount matches turf price
      if (amount !== turf.price) {
        return res.status(400).json({ 
          message: 'Invalid amount',
          details: 'The payment amount does not match the turf price'
        });
      }

      try {
        // Try to create a payment intent with Stripe using retry logic
        const paymentIntent = await retryOperation(async () => {
          const intent = await stripe.paymentIntents.create({
            amount: amount * 100, // Stripe expects amount in cents
            currency: 'inr',
            metadata: {
              userId: req.user.id,
              turfId,
              date: bookingDate.toISOString(),
              slot
            },
          });
          return intent;
        });
    
        return res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        });
      } catch (error) {
        console.error('Stripe error details:', {
          code: error.code,
          type: error.type,
          message: error.message,
          rawError: error.raw
        });

        // Check if it's a network-related error
        if (
          error.type === 'StripeConnectionError' || 
          error.code === 'ENOTFOUND' ||
          error.code === 'ECONNREFUSED'
        ) {
          return res.status(503).json({ 
            message: 'Card payment system temporarily unavailable',
            details: 'Please try an alternative payment method or try again later',
            isStripeDown: true,
            technicalDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }

        // Handle other Stripe errors
        return res.status(400).json({ 
          message: 'Payment initialization failed',
          details: error.message,
          code: error.code
        });
      }
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ 
        message: 'Failed to create payment intent',
        details: error.message
      });
    }
});
  
  // Webhook to handle Stripe events
  app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
  
    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET // Use environment variable for webhook secret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      try {
        // Extract metadata
        const { userId, turfId, date, slot } = paymentIntent.metadata;
        
        // Get turf and admin details
        const turf = await Turf.findById(turfId);
        if (!turf) {
          console.error('Turf not found for payment:', turfId);
          return res.status(400).json({ message: 'Turf not found' });
        }
  
        const admin = await User.findById(turf.owner);
        if (!admin) {
          console.error('Admin not found for turf:', turf.owner);
          return res.status(400).json({ message: 'Turf admin not found' });
        }
  
        // Create booking
        const booking = new Booking({
          userId,
          turfId,
          date: new Date(date),
          slot,
          paymentMethod: 'card', // Stripe payments are card-based
          adminContact: {
            name: admin.name,
            phone: admin.phone,
            email: admin.email
          }
        });
        await booking.save();
  
        // Create notification for admin
        const notification = new Notification({
          userId,
          adminId: turf.owner,
          turfId,
          type: 'booking',
          message: `New booking for ${turf.name} on ${new Date(date).toLocaleDateString()} at ${slot} (Payment: card)`
        });
        await notification.save();
  
        // Update user's bookings array
        await User.findByIdAndUpdate(
          userId,
          { $push: { bookings: booking._id } }
        );
  
        console.log('Payment succeeded and booking created:', booking._id);
      } catch (error) {
        console.error('Error processing successful payment:', error);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      console.log('Payment failed:', event.data.object.id);
    }
  
    // Return a 200 response to acknowledge receipt of the event
    res.json({received: true});
  });
  
  // Update the existing bookings endpoint to support both direct and Stripe payments
  app.post('/bookings', authenticateToken, async (req, res) => {
    try {
        const { turfId, date, slot, paymentMethod, paymentIntentId } = req.body;
        console.log('Booking request:', { turfId, date, slot, paymentMethod });

        // Validate required fields
        const missingFields = [];
        if (!turfId) missingFields.push('turfId');
        if (!date) missingFields.push('date');
        if (!slot) missingFields.push('slot');
        if (!paymentMethod) missingFields.push('paymentMethod');

        if (missingFields.length > 0) {
            console.log('Missing fields:', missingFields);
            return res.status(400).json({ 
                message: 'Missing required fields', 
                details: missingFields
            });
        }

        // Validate date format
        const bookingDate = new Date(date);
        if (isNaN(bookingDate.getTime())) {
            console.log('Invalid date format:', date);
            return res.status(400).json({ 
                message: 'Invalid date format',
                details: 'Please provide a valid date'
            });
        }

        // Validate payment method
        const validPaymentMethods = ['cash', 'card', 'phonepe', 'gpay', 'paytm'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            console.log('Invalid payment method:', paymentMethod);
            return res.status(400).json({ 
                message: 'Invalid payment method',
                details: `Payment method must be one of: ${validPaymentMethods.join(', ')}`
            });
        }

        // Validate payment intent for card payments
        if (paymentMethod === 'card' && !paymentIntentId) {
            console.log('Missing payment intent ID for card payment');
            return res.status(400).json({ 
                message: 'Card payment requires payment intent ID',
                details: 'Please complete the payment process first'
            });
        }

        if (paymentMethod !== 'card' && paymentIntentId) {
            console.log('Unexpected payment intent ID for non-card payment');
            return res.status(400).json({ 
                message: 'Invalid payment configuration',
                details: 'Payment intent ID should only be provided for card payments'
            });
        }

        // Check if slot is already booked
        const existingBooking = await Booking.findOne({
            turfId,
            date: bookingDate,
            slot,
            status: 'confirmed'
        });

        if (existingBooking) {
            console.log('Slot already booked:', { existingBookingId: existingBooking._id });
            return res.status(400).json({ 
                message: 'Slot already booked',
                details: 'This time slot has already been booked by someone else'
            });
        }

        // Get turf and admin details
        const turf = await Turf.findById(turfId);
        if (!turf) {
            console.log('Turf not found:', turfId);
            return res.status(404).json({ message: 'Turf not found' });
        }

        const admin = await User.findById(turf.owner);
        if (!admin) {
            console.log('Admin not found:', turf.owner);
            return res.status(404).json({ message: 'Turf admin not found' });
        }

        // For card payments, verify payment intent
        if (paymentMethod === 'card') {
            try {
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                
                if (paymentIntent.status !== 'succeeded') {
                    console.log('Payment not completed:', paymentIntent.status);
                    return res.status(400).json({ 
                        message: 'Payment incomplete',
                        details: 'Please complete the payment process first'
                    });
                }

                // Verify payment details match booking
                if (paymentIntent.metadata.userId !== req.user.id ||
                    paymentIntent.metadata.turfId !== turfId ||
                    new Date(paymentIntent.metadata.date).toISOString() !== bookingDate.toISOString() ||
                    paymentIntent.metadata.slot !== slot) {
                    console.log('Payment details mismatch:', {
                        expected: {
                            userId: req.user.id,
                            turfId,
                            date: bookingDate.toISOString(),
                            slot
                        },
                        received: paymentIntent.metadata
                    });
                    return res.status(400).json({ 
                        message: 'Payment verification failed',
                        details: 'Payment details do not match booking details'
                    });
                }
            } catch (error) {
                console.log('Payment verification error:', error);
                return res.status(400).json({ 
                    message: 'Payment verification failed',
                    details: error.message
                });
            }
        }

        // Create booking
        const booking = new Booking({
            userId: req.user.id,
            turfId,
            date: bookingDate,
            slot,
            paymentMethod,
            adminContact: {
                name: admin.name,
                phone: admin.phone,
                email: admin.email
            }
        });
        await booking.save();

        // Create payment record
        const payment = new Payment({
            userId: req.user.id,
            bookingId: booking._id,
            turfId,
            amount: turf.price,
            paymentMethod,
            status: paymentMethod === 'card' ? 'succeeded' : 'pending',
            transactionId: paymentIntentId || undefined,
            metadata: paymentMethod === 'card' ? { stripePaymentIntentId: paymentIntentId } : undefined
        });
        await payment.save();

        // Create notification
        const notification = new Notification({
            userId: req.user.id,
            adminId: turf.owner,
            turfId,
            type: 'booking',
            message: `New booking for ${turf.name} on ${bookingDate.toLocaleDateString()} at ${slot}`
        });
        await notification.save();

        // Update user's bookings array
        await User.findByIdAndUpdate(
            req.user.id,
            { $push: { bookings: booking._id } }
        );

        console.log('Booking created successfully:', booking._id);
        res.status(201).json({
            booking,
            payment: {
                _id: payment._id,
                amount: payment.amount,
                status: payment.status,
                transactionId: payment.transactionId
            }
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ 
            message: 'Failed to create booking',
            error: error.message,
            details: 'An unexpected error occurred while processing your booking'
        });
    }
});
  
  // Add an endpoint to get payment methods
  app.get('/payment-methods', authenticateToken, (req, res) => {
      try {
          const paymentMethods = [
              { id: 'cash', name: 'Cash', description: 'Pay at the venue' },
              { id: 'card', name: 'Credit/Debit Card', description: 'Pay securely with Stripe' },
              { id: 'phonepe', name: 'PhonePe', description: 'Pay with PhonePe' },
              { id: 'gpay', name: 'Google Pay', description: 'Pay with Google Pay' },
              { id: 'paytm', name: 'Paytm', description: 'Pay with Paytm' }
          ];
          
          res.json(paymentMethods);
      } catch (error) {
          res.status(500).json({ message: error.message });
      }
  });
  
  // Add an endpoint to check if a payment method requires online payment
  app.get('/payment-methods/:method/requires-online', authenticateToken, (req, res) => {
      try {
          const { method } = req.params;
          const requiresOnlinePayment = method === 'card';
          
          res.json({ requiresOnlinePayment });
      } catch (error) {
          res.status(500).json({ message: error.message });
      }
  });

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Auth Routes
app.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            phone
        });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token, role: user.role });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin Routes
app.post('/turfs', authenticateToken, isAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const { name, location, sport, price, description, availability, address } = req.body;
        
        const turfData = {
            name,
            location,
            sport,
            price: Number(price),
            description,
            address,
            owner: req.user.id,
            availability: JSON.parse(availability),
            images: req.files.map(file => ({
                filename: file.filename,
                path: `/uploads/${file.filename}`
            }))
        };
        
        const turf = new Turf(turfData);
        await turf.save();
        res.status(201).json(turf);
    } catch (error) {
        // Delete uploaded files if turf creation fails
        if (req.files) {
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
        }
        res.status(500).json({ message: error.message });
    }
});

app.put('/turfs/:id', authenticateToken, isAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const turf = await Turf.findOne({ _id: req.params.id, owner: req.user.id });
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found or unauthorized' });
        }

        // Delete old images if new ones are uploaded
        if (req.files && req.files.length > 0) {
            // Delete old image files
            turf.images.forEach(image => {
                const filePath = path.join(__dirname, image.path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });

            // Update with new images
            turf.images = req.files.map(file => ({
                filename: file.filename,
                path: `/uploads/${file.filename}`
            }));
        }

        // Update other fields
        Object.assign(turf, req.body);
        await turf.save();
        
        res.json(turf);
    } catch (error) {
        // Delete newly uploaded files if update fails
        if (req.files) {
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
        }
        res.status(500).json({ message: error.message });
    }
});

app.delete('/turfs/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const turf = await Turf.findOne({ _id: req.params.id, owner: req.user.id });
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found or unauthorized' });
        }

        // Delete image files
        turf.images.forEach(image => {
            const filePath = path.join(__dirname, image.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        await Turf.findByIdAndDelete(req.params.id);
        res.json({ message: 'Turf deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add route for getting admin's own turfs
app.get('/admin/turfs', authenticateToken, isAdmin, async (req, res) => {
    try {
        const turfs = await Turf.find({ owner: req.user.id });
        res.json(turfs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User Routes
app.get('/turfs', authenticateToken, async (req, res) => {
    try {
        const { location, sport, minPrice, maxPrice, sortBy, sortOrder } = req.query;
        
        // Build filter query
        const filter = {};
        if (location) filter.location = location;
        if (sport) filter.sport = sport;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Build sort query
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }

        const turfs = await Turf.find(filter).sort(sort);
        res.json(turfs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/bookings/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
            { new: true }
        );
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/bookings/history', authenticateToken, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id })
            .populate('turfId')
            .sort({ bookingDate: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/turfs/:id/reviews', authenticateToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const { id } = req.params;

        // Input validation
        if (!rating || !comment) {
            return res.status(400).json({ message: 'Rating and comment are required' });
        }

        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
        }

        if (typeof comment !== 'string' || comment.trim().length < 1) {
            return res.status(400).json({ message: 'Comment cannot be empty' });
        }

        // Check if turf exists
        const turf = await Turf.findById(id);
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        // Check if user has a confirmed booking for this turf that is in the past
        const userBookings = await Booking.find({
            userId: req.user.id,
            turfId: id,
            status: 'confirmed'
        });

        if (!userBookings.length) {
            return res.status(403).json({ message: 'You must have a confirmed booking to review this turf' });
        }

        const hasValidBooking = userBookings.some(booking => {
            const bookingDate = new Date(booking.date);
            const [startTime] = booking.slot.split('-');
            const [hours, minutes] = startTime.split(':').map(Number);
            bookingDate.setHours(hours, minutes, 0);
            return bookingDate < new Date();
        });

        if (!hasValidBooking) {
            return res.status(403).json({ 
                message: 'You can only review turfs after your booking time has passed' 
            });
        }

        // Check if user has already reviewed this turf
        const existingReview = turf.reviews.find(
            review => review.userId.toString() === req.user.id
        );

        if (existingReview) {
            // Update existing review
            existingReview.rating = rating;
            existingReview.comment = comment;
            existingReview.date = new Date();
        } else {
            // Add new review
            turf.reviews.push({
                userId: req.user.id,
                rating,
                comment,
                date: new Date()
            });
        }

        // Calculate and update average rating
        const totalRating = turf.reviews.reduce((sum, review) => sum + review.rating, 0);
        turf.averageRating = totalRating / turf.reviews.length;

        await turf.save();

        // Populate user details for the response
        const updatedTurf = await Turf.findById(id)
            .populate('reviews.userId', 'name profilePicture')
            .populate('owner', 'name');

        // Create notification for turf owner
        const notification = new Notification({
            userId: req.user.id,
            adminId: turf.owner,
            turfId: id,
            type: 'review',
            message: `New ${rating}-star review for ${turf.name} ${existingReview ? '(Updated)' : ''}`
        });
        await notification.save();

        // Return response with updated review data
        res.json({
            message: `Review ${existingReview ? 'updated' : 'added'} successfully`,
            turf: {
                _id: updatedTurf._id,
                name: updatedTurf.name,
                averageRating: updatedTurf.averageRating,
                reviews: updatedTurf.reviews.map(review => ({
                    _id: review._id,
                    rating: review.rating,
                    comment: review.comment,
                    date: review.date,
                    user: {
                        _id: review.userId._id,
                        name: review.userId.name,
                        profilePicture: review.userId.profilePicture
                    }
                }))
            }
        });
    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({ 
            message: 'Failed to submit review',
            error: error.message 
        });
    }
});

// Add endpoint to get turf reviews
app.get('/turfs/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        const { sort = 'recent', rating } = req.query;

        const turf = await Turf.findById(id)
            .populate('reviews.userId', 'name profilePicture');

        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        let reviews = turf.reviews;

        // Filter by rating if specified
        if (rating) {
            reviews = reviews.filter(review => review.rating === parseInt(rating));
        }

        // Sort reviews
        switch (sort) {
            case 'recent':
                reviews.sort((a, b) => b.date - a.date);
                break;
            case 'rating-high':
                reviews.sort((a, b) => b.rating - a.rating);
                break;
            case 'rating-low':
                reviews.sort((a, b) => a.rating - b.rating);
                break;
        }

        // Calculate rating statistics
        const ratingStats = {
            average: turf.averageRating || 0,
            total: reviews.length,
            distribution: {
                5: reviews.filter(r => r.rating === 5).length,
                4: reviews.filter(r => r.rating === 4).length,
                3: reviews.filter(r => r.rating === 3).length,
                2: reviews.filter(r => r.rating === 2).length,
                1: reviews.filter(r => r.rating === 1).length
            }
        };

        res.json({
            stats: ratingStats,
            reviews: reviews.map(review => ({
                _id: review._id,
                rating: review.rating,
                comment: review.comment,
                date: review.date,
                user: {
                    _id: review.userId._id,
                    name: review.userId.name,
                    profilePicture: review.userId.profilePicture
                }
            }))
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch reviews',
            error: error.message 
        });
    }
});

app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: req.body },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add profile picture upload endpoint
app.post('/profile/picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old profile picture if exists
        if (user.profilePicture && user.profilePicture.filename) {
            const oldFilePath = path.join(__dirname, 'uploads', user.profilePicture.filename);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // Update user with new profile picture
        user.profilePicture = {
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`
        };
        await user.save();

        res.json(user.profilePicture);
    } catch (error) {
        // Delete uploaded file if operation fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: error.message });
    }
});

// Add change password endpoint
app.post('/profile/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add delete account endpoint
app.delete('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete profile picture if exists
        if (user.profilePicture && user.profilePicture.filename) {
            const filePath = path.join(__dirname, 'uploads', user.profilePicture.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete user's turfs and their images
        const turfs = await Turf.find({ owner: user._id });
        for (const turf of turfs) {
            // Delete turf images
            turf.images.forEach(image => {
                const filePath = path.join(__dirname, 'uploads', image.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        await Turf.deleteMany({ owner: user._id });

        // Delete user's bookings
        await Booking.deleteMany({ userId: user._id });

        // Finally delete the user
        await User.findByIdAndDelete(user._id);

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add notifications routes
app.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { userId: req.user.id },
                { adminId: req.user.id }
            ]
        })
        .populate('userId', 'name')
        .populate('turfId', 'name')
        .sort({ createdAt: -1 });
        
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add endpoint to get booked slots
app.get('/bookings/slots/:turfId', authenticateToken, async (req, res) => {
    try {
        const { turfId } = req.params;
        const { date } = req.query;

        const bookedSlots = await Booking.find({
            turfId,
            date: new Date(date),
            status: 'confirmed'
        }).select('slot');

        res.json(bookedSlots.map(booking => booking.slot));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin Routes
app.get('/admin/bookings', authenticateToken, isAdmin, async (req, res) => {
    try {
        // First get all turfs owned by the admin
        const adminTurfs = await Turf.find({ owner: req.user.id });
        const turfIds = adminTurfs.map(turf => turf._id);

        // Get bookings for these turfs
        const bookings = await Booking.find({ turfId: { $in: turfIds } })
            .populate('userId', 'name email phone')
            .populate('turfId', 'name location price')
            .sort({ bookingDate: -1 });

        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            userName: booking.userId.name,
            userEmail: booking.userId.email,
            userPhone: booking.userId.phone,
            turfName: booking.turfId.name,
            turfLocation: booking.turfId.location,
            amount: booking.turfId.price,
            bookingDate: booking.date,
            timeSlot: booking.slot,
            status: booking.status,
            createdAt: booking.bookingDate
        }));

        res.json(formattedBookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add endpoint for deleting a booking
app.delete('/admin/bookings/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify that the turf belongs to this admin
        const turf = await Turf.findById(booking.turfId);
        if (turf.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this booking' });
        }

        // Create notification for user about booking deletion
        const notification = new Notification({
            userId: booking.userId,
            adminId: req.user.id,
            turfId: booking.turfId,
            type: 'cancellation',
            message: `Your booking for ${turf.name} has been deleted by the admin`
        });
        await notification.save();

        // Delete the booking
        await Booking.findByIdAndDelete(id);
        
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add endpoint to update booking status
app.put('/admin/bookings/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify that the turf belongs to this admin
        const turf = await Turf.findById(booking.turfId);
        if (turf.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this booking' });
        }

        booking.status = status;
        await booking.save();

        // Create notification for user
        const notification = new Notification({
            userId: booking.userId,
            adminId: req.user.id,
            turfId: booking.turfId,
            type: status === 'confirmed' ? 'booking' : 'cancellation',
            message: `Your booking for ${turf.name} has been ${status}`
        });
        await notification.save();

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add report routes
app.get('/admin/reports/overview', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { timeframe } = req.query; // daily, weekly, monthly, yearly
        const adminId = req.user.id;

        // Get admin's turfs
        const turfs = await Turf.find({ owner: adminId });
        const turfIds = turfs.map(turf => turf._id);

        // Get all bookings for these turfs
        const bookings = await Booking.find({
            turfId: { $in: turfIds },
            bookingDate: {
                $gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
            }
        }).populate('turfId').populate('userId');

        // Calculate revenue metrics
        const totalRevenue = bookings.reduce((sum, booking) => sum + booking.turfId.price, 0);
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

        // Calculate revenue by turf
        const revenueByTurf = {};
        turfs.forEach(turf => {
            const turfBookings = bookings.filter(b => b.turfId._id.toString() === turf._id.toString());
            revenueByTurf[turf.name] = turfBookings.reduce((sum, b) => sum + b.turfId.price, 0);
        });

        // Calculate revenue by day for the chart
        const revenueByDay = {};
        bookings.forEach(booking => {
            const date = booking.bookingDate.toISOString().split('T')[0];
            revenueByDay[date] = (revenueByDay[date] || 0) + booking.turfId.price;
        });

        // Popular time slots
        const timeSlotStats = {};
        bookings.forEach(booking => {
            timeSlotStats[booking.slot] = (timeSlotStats[booking.slot] || 0) + 1;
        });

        // Customer demographics
        const customerLocations = {};
        const customerPreferences = {};
        bookings.forEach(booking => {
            customerLocations[booking.turfId.location] = (customerLocations[booking.turfId.location] || 0) + 1;
            customerPreferences[booking.turfId.sport] = (customerPreferences[booking.turfId.sport] || 0) + 1;
        });

        res.json({
            overview: {
                totalRevenue,
                confirmedBookings,
                cancelledBookings,
                totalBookings: bookings.length,
                averageBookingValue: totalRevenue / bookings.length || 0
            },
            revenueByTurf,
            revenueByDay,
            timeSlotStats,
            customerInsights: {
                locations: customerLocations,
                preferences: customerPreferences
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/admin/reports/detailed', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const adminId = req.user.id;

        const turfs = await Turf.find({ owner: adminId });
        const turfIds = turfs.map(turf => turf._id);

        const dateFilter = {
            bookingDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        const bookings = await Booking.find({
            ...dateFilter,
            turfId: { $in: turfIds }
        })
        .populate('turfId')
        .populate('userId');

        // Detailed analytics calculations
        const detailedStats = {
            dailyRevenue: {},
            sportTypeBreakdown: {},
            peakHours: {},
            customerRetention: {},
            bookingTrends: {},
            seasonalTrends: {}
        };

        // Calculate various metrics
        bookings.forEach(booking => {
            const date = booking.bookingDate.toISOString().split('T')[0];
            const hour = booking.slot.split(':')[0];
            const sport = booking.turfId.sport;
            const userId = booking.userId._id.toString();
            const month = new Date(booking.bookingDate).getMonth();

            // Daily revenue
            detailedStats.dailyRevenue[date] = (detailedStats.dailyRevenue[date] || 0) + booking.turfId.price;

            // Sport type breakdown
            detailedStats.sportTypeBreakdown[sport] = (detailedStats.sportTypeBreakdown[sport] || 0) + 1;

            // Peak hours analysis
            detailedStats.peakHours[hour] = (detailedStats.peakHours[hour] || 0) + 1;

            // Customer retention
            detailedStats.customerRetention[userId] = (detailedStats.customerRetention[userId] || 0) + 1;

            // Seasonal trends
            detailedStats.seasonalTrends[month] = (detailedStats.seasonalTrends[month] || 0) + booking.turfId.price;
        });

        res.json(detailedStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add dashboard stats endpoint
app.get('/admin/dashboard/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const adminId = req.user.id;

        // Get admin's turfs
        const turfs = await Turf.find({ owner: adminId });
        const turfIds = turfs.map(turf => turf._id);

        // Get current date and start of today
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all bookings for these turfs
        const allBookings = await Booking.find({
            turfId: { $in: turfIds }
        }).populate('userId');

        // Get today's bookings
        const todayBookings = allBookings.filter(booking => 
            booking.bookingDate >= startOfToday
        );

        // Get this month's bookings
        const monthBookings = allBookings.filter(booking =>
            booking.bookingDate >= startOfMonth
        );

        // Calculate total revenue
        const totalRevenue = allBookings.reduce((sum, booking) => sum + booking.turfId.price, 0);

        // Get recent bookings
        const recentBookings = await Booking.find({ turfId: { $in: turfIds } })
            .sort({ bookingDate: -1 })
            .limit(5)
            .populate('userId', 'name')
            .populate('turfId', 'name')
            .lean();

        // Count active users (users with bookings this month)
        const activeUsers = new Set(monthBookings.map(booking => booking.userId._id.toString())).size;

        const stats = {
            totalBookings: allBookings.length,
            totalRevenue,
            activeUsers,
            totalTurfs: turfs.length,
            recentBookings: recentBookings.map(booking => ({
                id: booking._id,
                user: booking.userId.name,
                turf: booking.turfId.name,
                date: booking.date,
                time: booking.slot,
                status: booking.status
            }))
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User dashboard stats endpoint
app.get('/user/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('name');

        // Get all user's bookings
        const bookings = await Booking.find({ userId })
            .populate('turfId')
            .sort({ bookingDate: -1 });

        // Calculate activity stats
        const sportsPlayed = new Set(bookings.map(b => b.turfId.sport)).size;
        const sportCounts = {};
        let totalHours = 0;

        bookings.forEach(booking => {
            sportCounts[booking.turfId.sport] = (sportCounts[booking.turfId.sport] || 0) + 1;
            // Assuming each booking is for 1 hour
            totalHours += 1;
        });

        const favoriteGame = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

        // Get upcoming booking
        const now = new Date();
        const upcomingBooking = await Booking.findOne({
            userId,
            date: { $gte: now },
            status: 'confirmed'
        })
        .populate('turfId')
        .sort({ date: 1 });

        // Get recent bookings
        const recentBookings = await Booking.find({
            userId,
            status: 'confirmed'
        })
        .populate('turfId')
        .sort({ date: -1 })
        .limit(5);

        // Get favorite venues (most booked)
        const bookingsByVenue = {};
        bookings.forEach(booking => {
            const turfId = booking.turfId._id.toString();
            if (!bookingsByVenue[turfId]) {
                bookingsByVenue[turfId] = {
                    id: turfId,
                    name: booking.turfId.name,
                    count: 0,
                    rating: booking.turfId.reviews?.reduce((acc, r) => acc + r.rating, 0) / 
                           (booking.turfId.reviews?.length || 1)
                };
            }
            bookingsByVenue[turfId].count++;
        });

        const favoriteVenues = Object.values(bookingsByVenue)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        // Get weekly activity data
        const weeklyActivity = Array(7).fill(0);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        bookings.forEach(booking => {
            if (booking.date >= oneWeekAgo) {
                const dayIndex = new Date(booking.date).getDay();
                weeklyActivity[dayIndex]++;
            }
        });

        // Normalize weekly activity for chart (0 to 1 scale)
        const maxActivity = Math.max(...weeklyActivity, 1);
        const normalizedActivity = weeklyActivity.map(count => count / maxActivity);

        // Get weather data (simulated for now)
        const weather = {
            temp: 28,
            condition: 'Sunny',
            humidity: 65,
            idealForSports: true
        };

        const dashboardData = {
            name: user.name,
            activityStats: {
                totalBookings: bookings.length,
                sportsPlayed,
                favoriteGame,
                hoursPlayed: totalHours
            },
            upcomingBooking: upcomingBooking ? {
                venue: upcomingBooking.turfId.name,
                date: upcomingBooking.date,
                time: upcomingBooking.slot,
                sport: upcomingBooking.turfId.sport
            } : null,
            recentBookings: recentBookings.map(booking => ({
                id: booking._id,
                venue: booking.turfId.name,
                date: booking.date,
                time: booking.slot,
                sport: booking.turfId.sport
            })),
            favoriteVenues,
            weeklyActivity: {
                data: normalizedActivity,
                labels: days
            },
            weather
        };

        res.json(dashboardData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add favorite schema
const favoriteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    turfId: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: true },
    createdAt: { type: Date, default: Date.now }
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

// Add favorites routes
app.get('/user/favorites', authenticateToken, async (req, res) => {
    try {
        const favorites = await Favorite.find({ userId: req.user.id })
            .populate('turfId')
            .sort({ createdAt: -1 });
        
        // Map to return turf details directly
        const turfs = favorites.map(fav => fav.turfId);
        res.json(turfs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/user/favorites/:turfId', authenticateToken, async (req, res) => {
    try {
        const { turfId } = req.params;
        
        // Check if turf exists
        const turf = await Turf.findById(turfId);
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        // Check if already favorited
        const existingFavorite = await Favorite.findOne({ 
            userId: req.user.id, 
            turfId 
        });
        
        if (existingFavorite) {
            return res.status(400).json({ message: 'Turf already in favorites' });
        }

        const favorite = new Favorite({
            userId: req.user.id,
            turfId
        });
        await favorite.save();

        res.status(201).json(favorite);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/user/favorites/:turfId', authenticateToken, async (req, res) => {
    try {
        const { turfId } = req.params;
        await Favorite.findOneAndDelete({ 
            userId: req.user.id, 
            turfId 
        });
        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Get all reviews by a user
app.get('/turfs/reviews', authenticateToken, async (req, res) => {
    try {
        const { sort = 'recent', rating } = req.query;
        const userId = req.user.id;

        // Find all turfs with reviews by this user
        const turfs = await Turf.find({
            'reviews.userId': userId
        }).populate('reviews.userId', 'name profilePicture');

        // Extract and format all reviews by the user
        let userReviews = [];
        turfs.forEach(turf => {
            const turfReviews = turf.reviews
                .filter(review => review.userId._id.toString() === userId)
                .map(review => ({
                    _id: review._id,
                    rating: review.rating,
                    comment: review.comment,
                    date: review.date,
                    turf: {
                        _id: turf._id,
                        name: turf.name,
                        location: turf.location
                    },
                    user: {
                        _id: review.userId._id,
                        name: review.userId.name,
                        profilePicture: review.userId.profilePicture
                    }
                }));
            userReviews = [...userReviews, ...turfReviews];
        });

        // Apply rating filter if specified
        if (rating) {
            userReviews = userReviews.filter(review => review.rating === parseInt(rating));
        }

        // Apply sorting
        switch (sort) {
            case 'recent':
                userReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'rating-high':
                userReviews.sort((a, b) => b.rating - a.rating);
                break;
            case 'rating-low':
                userReviews.sort((a, b) => a.rating - b.rating);
                break;
        }

        // Calculate rating statistics
        const total = userReviews.length;
        const distribution = {
            5: userReviews.filter(r => r.rating === 5).length,
            4: userReviews.filter(r => r.rating === 4).length,
            3: userReviews.filter(r => r.rating === 3).length,
            2: userReviews.filter(r => r.rating === 2).length,
            1: userReviews.filter(r => r.rating === 1).length
        };
        const average = total > 0
            ? userReviews.reduce((sum, review) => sum + review.rating, 0) / total
            : 0;

        res.json({
            stats: {
                average,
                total,
                distribution
            },
            reviews: userReviews
        });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch reviews',
            error: error.message 
        });
    }
});

// Add route to get user payment history
app.get('/user/payments', authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate({
        path: 'bookingId',
        select: 'slot'
      })
      .populate({
        path: 'turfId',
        select: 'name'
      })
      .sort({ date: -1 });

    const formattedPayments = payments.map(payment => ({
      _id: payment._id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      transactionId: payment.transactionId || 'N/A',
      date: payment.date,
      turf: payment.turfId,
      slot: payment.bookingId?.slot
    }));

    res.json(formattedPayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});