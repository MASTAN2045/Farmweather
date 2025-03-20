const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// Register User
router.post('/register', [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: 'Validation error',
                errors: errors.array() 
            });
        }

        let { username, email, password } = req.body;
        
        // Normalize email (trim and lowercase)
        email = email.trim().toLowerCase();
        username = username.trim();
        
        console.log(`Registration attempt for email: ${email}, username: ${username}`);

        // Check if user exists by email
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User with this email already exists:', email);
            return res.status(400).json({ 
                success: false,
                message: 'Email is already registered' 
            });
        }

        // Check if username is taken
        existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('Username already taken:', username);
            return res.status(400).json({ 
                success: false,
                message: 'Username is already taken' 
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save user to database
        const savedUser = await user.save();
        console.log('New user created:', savedUser._id, email);

        // Create token
        const token = jwt.sign(
            { id: savedUser._id, email: savedUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Login User
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: 'Validation error',
                errors: errors.array() 
            });
        }

        const { email, password } = req.body;

        // Validate input presence
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password'
            });
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();
        console.log('Login attempt for email:', normalizedEmail);

        // Find user by email
        const user = await User.findOne({ email: normalizedEmail });
        
        if (!user) {
            console.log('User not found:', normalizedEmail);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password for user:', normalizedEmail);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create and sign JWT token
        const token = jwt.sign(
            { 
                id: user._id,
                email: user.email,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log successful login
        console.log('Successful login for user:', user.email);

        // Send success response
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get User Data
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        res.json({
            username: user.username,
            email: user.email,
            favoriteCities: user.favoriteCities
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Favorite City
router.post('/favorites', auth, async (req, res) => {
    try {
        const { cityName, countryCode } = req.body;
        const user = await User.findById(req.user);

        // Check if city already exists in favorites
        const cityExists = user.favoriteCities.some(
            city => city.cityName === cityName && city.countryCode === countryCode
        );

        if (cityExists) {
            return res.status(400).json({ message: 'City already in favorites' });
        }

        user.favoriteCities.push({ cityName, countryCode });
        await user.save();

        res.json(user.favoriteCities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove Favorite City
router.delete('/favorites', auth, async (req, res) => {
    try {
        const { cityName, countryCode } = req.body;
        const user = await User.findById(req.user);

        user.favoriteCities = user.favoriteCities.filter(
            city => !(city.cityName === cityName && city.countryCode === countryCode)
        );

        await user.save();
        res.json(user.favoriteCities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 