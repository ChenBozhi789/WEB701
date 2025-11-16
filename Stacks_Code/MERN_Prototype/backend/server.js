const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Middlewares
// configure CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(cookieParser()); // parse cookies
app.use(express.json()); // parse JSON bodies

// health check route
app.get("/", (req, res) => {
  res.send("✅ API is working");
});

// business routes
app.use('/api/auth', require('./routes/auth'));  
app.use('/api/items', require('./routes/item'));
app.use('/api/tokens', require('./routes/token'));
app.use('/api/transactions', require('./routes/transaction'));
// serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// start the server
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);