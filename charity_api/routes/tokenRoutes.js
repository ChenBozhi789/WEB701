const express = require('express');
const router = express.Router();

// http://localhost:3000/api/tokens/1
router.get('/:id', (req, res) => {
    res.json({ accountId: req.params.id, name: 'This is query result of Token' });
});

// http://localhost:3000/api/tokens
router.post('/', (req, res) => {
    res.status(201).json({ message: 'Token is created successfully' });
});

// http://localhost:3000/api/tokens/1
router.put('/:id', (req, res) => {
    res.json({ message: `TokenID is ${req.params.id} updated` });
});


module.exports = router;
