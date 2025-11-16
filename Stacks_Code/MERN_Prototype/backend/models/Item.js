const mongoose = require('mongoose');

// item schema
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  type: { type: String, enum: ['product', 'service'], required: true },
  description: { type: String, required: true, trim: true },
  tokenPrice: { type: Number, required: true, min: 1 },
  quantity: { type: Number, required: true, min: 0, default: 1 },
  reservedQuantity: { type: Number, required: true, min: 0, default: 0 }, // quantity reserved by pending transactions
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  
  // Image and AI Vision API fields
  imagePath: { type: String, trim: true }, // Local file path for uploaded image (e.g., "uploads/abc123.jpg")
  aiDetectedCategory: { type: String, trim: true }, // Category detected by AI Vision API
  aiSuggestedName: { type: String, trim: true }, // Name/suggestions from AI Vision API
  aiTags: [{ type: String, trim: true }], // Array of tags detected by AI (for filtering in Browse)
  aiConfidence: { type: Number, min: 0, max: 1 }, // Confidence score of AI detection (0-1)
  aiProcessedAt: { type: Date }, // Timestamp when AI analysis was performed
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// update updatedAt before saving
itemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// export model
module.exports = mongoose.model('Item', itemSchema);