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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            username,
            email,
            password
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Create token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
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