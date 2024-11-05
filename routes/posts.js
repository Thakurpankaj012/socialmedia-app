const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate, authorize } = require('../utils/authMiddleware');
const router = express.Router();

const postsPath = path.join(__dirname, '../data/posts.json');
const readPosts = () => JSON.parse(fs.readFileSync(postsPath));
const writePosts = (data) => fs.writeFileSync(postsPath, JSON.stringify(data, null, 2));

// Create a new post
router.post('/', authenticate, (req, res) => {
    const { title, content } = req.body;
    const posts = readPosts();
    const newPost = { id: Date.now(), title, content, authorId: req.user.id };

    posts.push(newPost);
    writePosts(posts);
    res.status(201).json(newPost);
});

// Get all posts
router.get('/', (req, res) => {
    const posts = readPosts();
    res.json(posts);
});

// Get a specific post by ID
router.get('/:id', (req, res) => {
    const posts = readPosts();
    const post = posts.find(p => p.id === parseInt(req.params.id));

    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
});

// Update a post
router.put('/:id', authenticate, (req, res) => {
    const posts = readPosts();
    const post = posts.find(p => p.id === parseInt(req.params.id));

    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const { title, content } = req.body;
    post.title = title || post.title;
    post.content = content || post.content;

    writePosts(posts);
    res.json(post);
});

// Delete a post
router.delete('/:id', authenticate, authorize('user'), (req, res) => {
    const posts = readPosts();
    const postIndex = posts.findIndex(p => p.id === parseInt(req.params.id));

    if (postIndex === -1) {
        return res.status(404).json({ message: 'Post not found' });
    }
    if (posts[postIndex].authorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    posts.splice(postIndex, 1);
    writePosts(posts);
    res.status(204).send();
});

module.exports = router;