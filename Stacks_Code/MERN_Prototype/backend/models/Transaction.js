const mongoose = require('mongoose');

// transaction schema
const txSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:   { type: Number, required: true, min: 1 },
  quantity: { type: Number, required: true, min: 1, default: 1 }, // quantity of items redeemed
  status:   { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
  item:     { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  message:  { type: String, default: "" },
  processedAt: { type: Date, default: null },
  createdAt:{ type: Date, default: Date.now },
  updatedAt:{ type: Date, default: Date.now }
});

// update updatedAt before saving
txSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', txSchema);