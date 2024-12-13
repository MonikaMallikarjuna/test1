import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from './models/user.js';
import { Order } from './models/order.js';

dotenv.config({ path: './config.env' });
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to register user' });
    }
});

// User Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ name: username }, process.env.access_token, { expiresIn: '1h' });
        res.json({ accessToken: token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to log in' });
    }
});

// Place Order (Authenticated Route)
app.post('/orders', authenticateToken, async (req, res) => {
    const { products } = req.body;

    try {
        const newOrder = new Order({ username: req.user.name, products });
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to place order' });
    }
});

// View Orders (Authenticated Route)
app.get('/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ username: req.user.name });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Logout User (Destroy JWT on Client Side)
app.post('/logout', (req, res) => {
    // Clients should remove the token on logout
    res.status(200).json({ message: 'Logged out successfully' });
});

// Middleware to Authenticate Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.access_token, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});
