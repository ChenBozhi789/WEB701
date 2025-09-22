const mongoose = require('mongoose');

// Item schema
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, default: "" },
  quantity: { type: Number, default: 1, min: 0 },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

// export model
module.exports = mongoose.model('Item', itemSchema);