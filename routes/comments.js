const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate, authorize } = require('../utils/authMiddleware');
const router = express.Router();

const commentsPath = path.join(__dirname, '../data/comments.json');
const readComments = () => JSON.parse(fs.readFileSync(commentsPath));
const writeComments = (data) => fs.writeFileSync(commentsPath, JSON.stringify(data, null, 2));

// Create a new comment
router.post('/:postId', authenticate, (req, res) => {
    const { content } = req.body;
    const comments = readComments();
    const newComment = { id: Date.now(), postId: req.params.postId, content, authorId: req.user.id };

    comments.push(newComment);
    writeComments(comments);
    res.status(201).json(newComment);
});

// Get all comments for a specific post
router.get('/:postId', (req, res) => {
    const comments = readComments();
    const postComments = comments.filter(c => c.postId === req.params.postId);
    res.json(postComments);
});

// Update a comment
router.put('/:commentId', authenticate, (req, res) => {
    const comments = readComments();
    const comment = comments.find(c => c.id === parseInt(req.params.commentId));

    if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
    }
    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    comment.content = req.body.content || comment.content;
    writeComments(comments);
    res.json(comment);
});

// Delete a comment
router.delete('/:commentId', authenticate, (req, res) => {
    const comments = readComments();
    const commentIndex = comments.findIndex(c => c.id === parseInt(req.params.commentId));

    if (commentIndex === -1) {
        return res.status(404).json({ message: 'Comment not found' });
    }
    if (comments[commentIndex].authorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    comments.splice(commentIndex, 1);
    writeComments(comments);
    res.status(204).send();
});

module.exports = router;