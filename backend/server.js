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
        const turfs = await Turf.find({});
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});