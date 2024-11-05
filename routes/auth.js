const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const usersPath = path.join(__dirname, '../data/users.json');
const secretKey = "your_secret_key";

const readUsers = () => JSON.parse(fs.readFileSync(usersPath));
const writeUsers = (data) => fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));

// Signup Route
router.post('/signup', (req, res) => {
    const { email, username, password, role } = req.body;
    const users = readUsers();

    if (users.some(user => user.email === email)) {
        return res.status(400).json({ message: 'Email already registered' });
    }
    if (users.some(user => user.username === username)) {
        return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = { id: Date.now(), email, username, password: hashedPassword, role: role || 'user' };

    users.push(newUser);
    writeUsers(users);

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, secretKey, { expiresIn: '1h' });
    res.json({ token });
});

// Login Route
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(user => user.email === email);

    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, secretKey, { expiresIn: '1h' });
    res.json({ token });
});

module.exports = router;