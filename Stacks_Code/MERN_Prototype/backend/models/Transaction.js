const mongoose = require('mongoose');

// Transaction schema
const txSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:   { type: Number, required: true, min: 1 },
  status:   { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', txSchema);