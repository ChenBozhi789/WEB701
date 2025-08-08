const express = require('express');
const router = express.Router();

// http://localhost:3000/api/accounts
router.post('/', (req, res) => {
    res.status(201).json({ message: 'Item created successfully' });
});

// http://localhost:3000/api/accounts/1
router.get('/:id', (req, res) => {
    res.json({ accountId: req.params.id, name: 'Tester' });
});

// http://localhost:3000/api/accounts/1
router.put('/:id', (req, res) => {
    res.json({ message: `Account ${req.params.id} updated` });
});

// http://localhost:3000/api/accounts/1
router.delete('/:id', (req, res) => {
    res.json({ message: `Account ${req.params.id} deleted` });
});

module.exports = router;
