const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
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
mongoose.connect('mongodb://localhost:27017/sportnest', {
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
    }]
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

// Update booking schema to include admin contact
const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    turfId: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf' },
    date: Date,
    slot: String,
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    bookingDate: { type: Date, default: Date.now },
    adminContact: {
        name: String,
        phone: String,
        email: String
    }
});

const User = mongoose.model('User', userSchema);
const Turf = mongoose.model('Turf', turfSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'Access denied' });

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    
    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

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
            'your_jwt_secret',
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

app.post('/bookings', authenticateToken, async (req, res) => {
    try {
        const { turfId, date, slot } = req.body;

        // Check if slot is already booked
        const existingBooking = await Booking.findOne({
            turfId,
            date,
            slot,
            status: 'confirmed'
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'This slot is already booked' });
        }

        // Get turf and admin details
        const turf = await Turf.findById(turfId);
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        const admin = await User.findById(turf.owner);
        if (!admin) {
            return res.status(404).json({ message: 'Turf admin not found' });
        }

        // Create booking with admin contact
        const booking = new Booking({
            userId: req.user.id,
            turfId,
            date,
            slot,
            adminContact: {
                name: admin.name,
                phone: admin.phone,
                email: admin.email
            }
        });
        await booking.save();

        // Create notification for admin
        const notification = new Notification({
            userId: req.user.id,
            adminId: turf.owner,
            turfId,
            type: 'booking',
            message: `New booking for ${turf.name} on ${new Date(date).toLocaleDateString()} at ${slot}`
        });
        await notification.save();

        // Update user's bookings array
        await User.findByIdAndUpdate(
            req.user.id,
            { $push: { bookings: booking._id } }
        );

        res.status(201).json(booking);
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
        const turf = await Turf.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    reviews: {
                        userId: req.user.id,
                        rating,
                        comment
                    }
                }
            },
            { new: true }
        );
        res.json(turf);
    } catch (error) {
        res.status(500).json({ message: error.message });
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