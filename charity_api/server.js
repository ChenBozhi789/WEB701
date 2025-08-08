const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Import  routes
const accountRoutes = require('./routes/accountRoutes');
const itemRoutes = require('./routes/itemRoutes');
const tokenRoutes = require('./routes/tokenRoutes');

app.use('/api/accounts', accountRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/tokens', tokenRoutes);

// Start server
app.listen(port, () => {
    console.log(`Account Server running on http://localhost:${port}`);
});
