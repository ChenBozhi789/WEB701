const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// configure CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// parse cookies
app.use(cookieParser());

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// parse JSON bodies
app.use(express.json());

// routes
app.use('/api/auth', require('./routes/auth'));  
app.use('/api/items', require('./routes/item'));
app.use('/api/tokens', require('./routes/token'));

// basic check route
app.get("/", (req, res) => {
  res.send("✅ API is working");
});

// start server
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);