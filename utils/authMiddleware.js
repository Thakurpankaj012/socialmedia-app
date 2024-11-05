const jwt = require('jsonwebtoken');
const secretKey = "your_secret_key"; // Use the same secret key as in auth.js

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // Attach user info to the request
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid Token' });
    }
};

const authorize = (role) => (req, res, next) => {
    if (req.user.role === role || req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
};

module.exports = { authenticate, authorize };