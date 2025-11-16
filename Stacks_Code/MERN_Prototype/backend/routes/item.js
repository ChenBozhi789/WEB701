const express = require('express');
const fs = require('fs');
const path = require('path');
const Item = require('../models/Item');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { requireAuth } = require('../middleware/auth');
const { handleUpload, handleOptionalUpload } = require('../middleware/upload');
const { analyzeImage } = require('../services/visionService');

const itemRouter = express.Router();

// GET all active items
itemRouter.get('/', async (req, res) => {
  try {
    const { category, type, aiTag } = req.query;
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (type) filter.type = type;
    
    // Filter by AI tag (searches in aiTags array, case-sensitive)
    if (aiTag) {
      filter.aiTags = { $in: [aiTag.trim()] };
    }
    
    const items = await Item.find(filter)
      .populate('owner', 'name email') // include owner info
      .sort({ createdAt: -1 }); // newest first
    
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET my items (must be before /:id to avoid route conflict)
itemRouter.get('/my', requireAuth, async (req, res) => {
  try {
    // only members can have items
    if (req.user.role !== 'member') {
      return res.status(403).json({ message: 'Only members can have items' });
    }
    
    const items = await Item.find({ owner: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single item by ID
itemRouter.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'name email');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST analyze image
itemRouter.post('/analyze-image', requireAuth, handleUpload, async (req, res) => {
  try {
    // only members can analyze images
    if (req.user.role !== 'member') {
      // clean up uploaded file if unauthorized
      if (req.file) {        
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: 'Only members can analyze images' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imagePath = req.file.path;
    
    try {
      // analyze image with Vision API
      const aiAnalysis = await analyzeImage(imagePath);
      
      // return analysis results along with image URL
      const imageUrl = `/uploads/${path.basename(req.file.filename)}`;
      
      res.json({
        success: true,
        imageUrl: imageUrl,
        imagePath: req.file.path,
        aiAnalysis: aiAnalysis
      });
    } catch (visionError) {
      // if Vision API fails, clean up uploaded file
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      
      console.error('Vision API error:', visionError);
      return res.status(500).json({ 
        message: 'Failed to analyze image', 
        error: visionError.message 
      });
    }
  } catch (err) {
    console.error(err);
    
    // clean up uploaded file on error
    if (req.file && req.file.path) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new item
// image is optional - can be uploaded here or via analyze-image endpoint
itemRouter.post('/', requireAuth, handleOptionalUpload, async (req, res) => {
  try {
    // validate req.user exists and has id
    if (!req.user || !req.user.id) {
      // clean up uploaded file if exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(401).json({ message: 'Authentication error: user ID not found' });
    }
    
    // only members can create items
    if (req.user.role !== 'member') {
      // clean up uploaded file if exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: 'Only members can create items' });
    }
    
    // parse body data (could be JSON or form-data from multer)
    // When using multer, form fields come as strings in req.body
    const parseField = (value) => {
      if (typeof value === 'string') {
        // try to parse as JSON (for arrays like aiTags)
        if (value.startsWith('[') || value.startsWith('{')) {
          try {
            return JSON.parse(value);
          } catch (e) {
            return value;
          }
        }
        return value;
      }
      return value;
    };
    
    const { 
      name, 
      category, 
      type, 
      description, 
      tokenPrice, 
      quantity,
      // ai analysis fields
      aiDetectedCategory,
      aiSuggestedName,
      aiTags: rawAiTags,
      aiConfidence,
      imagePath: providedImagePath
    } = req.body;
    
    // parse aiTags if it's a string
    const aiTags = rawAiTags ? parseField(rawAiTags) : null;
    
    // validate required fields
    if (!name || !category || !type || !description || !tokenPrice) {
      // clean up uploaded file if exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: 'Missing required fields: name, category, type, description, tokenPrice' 
      });
    }
    
    if (!['product', 'service'].includes(type)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Type must be "product" or "service"' });
    }
    
    if (Number(tokenPrice) < 1) {
      if (req.file) { 
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'tokenPrice must be at least 1' });
    }
    
    const qty = Number(quantity) || 1;
    if (qty < 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'quantity cannot be negative' });
    }
    
    // handle image: either from current upload or from previous analyze-image call
    let finalImagePath = null;
    let aiAnalysisResult = null;
    
    if (req.file) {
      // Image was uploaded in this request
      finalImagePath = req.file.path;
      
      // Analyze image with Vision API if not already analyzed
      if (!aiDetectedCategory || !aiTags) {
        try {
          aiAnalysisResult = await analyzeImage(finalImagePath);
        } catch (visionError) {
          console.error('Vision API error during item creation:', visionError);
          // Continue without AI analysis - don't fail the request
          aiAnalysisResult = null;
        }
      }
    } else if (providedImagePath) {
      // Image path was provided (from previous analyze-image call)
      finalImagePath = providedImagePath;
    }
    
    // Use AI analysis from request body or from Vision API call
    const finalAiCategory = aiDetectedCategory || (aiAnalysisResult?.aiDetectedCategory);
    const finalAiName = aiSuggestedName || (aiAnalysisResult?.aiSuggestedName);
    const finalAiTags = (aiTags && Array.isArray(aiTags)) ? aiTags : (aiAnalysisResult?.aiTags || []);
    const finalAiConfidence = aiConfidence || (aiAnalysisResult?.aiConfidence);
    const finalAiProcessedAt = aiAnalysisResult?.aiProcessedAt || new Date();
    
    // Convert imagePath to relative path for storage
    let imagePathForDb = null;
    if (finalImagePath) {
      // Store relative path from backend root
      const relativePath = path.relative(path.join(__dirname, '..'), finalImagePath);
      imagePathForDb = relativePath.replace(/\\/g, '/'); // Normalize path separators
    }
    
    // create item with owner automatically set
    const newItem = new Item({
      name: name.trim(),
      category: category.trim(),
      type,
      description: description.trim(),
      tokenPrice: Number(tokenPrice),
      quantity: qty,
      owner: req.user.id, // automatically set from authenticated user
      isActive: true,
      // Image and AI fields
      imagePath: imagePathForDb,
      aiDetectedCategory: finalAiCategory,
      aiSuggestedName: finalAiName,
      aiTags: finalAiTags,
      aiConfidence: finalAiConfidence,
      aiProcessedAt: finalAiProcessedAt
    });
    
    await newItem.save();
    
    // populate owner info before returning
    await newItem.populate('owner', 'name email');
    
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update item
itemRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Security Check: Only the owner can update their own items
    if (String(item.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only update your own items' });
    }
    
    // Security Check: Only members can update items
    if (req.user.role !== 'member') {
      return res.status(403).json({ message: 'Only members can update items' });
    }
    
    const { name, category, type, description, tokenPrice, quantity, isActive } = req.body;
    
    // update allowed fields
    if (name !== undefined) item.name = name.trim();
    if (category !== undefined) item.category = category.trim();
    if (type !== undefined) {
      if (!['product', 'service'].includes(type)) {
        return res.status(400).json({ message: 'Type must be "product" or "service"' });
      }
      item.type = type;
    }
    if (description !== undefined) item.description = description.trim();
    if (tokenPrice !== undefined) {
      if (Number(tokenPrice) < 1) {
        return res.status(400).json({ message: 'tokenPrice must be at least 1' });
      }
      item.tokenPrice = Number(tokenPrice);
    }
    if (quantity !== undefined) {
      const qty = Number(quantity);
      if (qty < 0) {
        return res.status(400).json({ message: 'quantity cannot be negative' });
      }
      item.quantity = qty;
    }
    if (isActive !== undefined) item.isActive = Boolean(isActive);
    
    await item.save();
    await item.populate('owner', 'name email');
    
    res.json(item);
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE item
itemRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Security Check: Only the owner can delete their own items  
    if (String(item.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only delete your own items' });
    }
    
    // Security Check: Only members can delete items
    if (req.user.role !== 'member') {
      return res.status(403).json({ message: 'Only members can delete items' });
    }
    
    // set isActive to false instead of actually deleting
    item.isActive = false;
    await item.save();
    
    res.json({ message: 'Item deactivated successfully', item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST redeem item
itemRouter.post('/:id/redeem', requireAuth, async (req, res) => {
  try {
    // Security Check: Only beneficiaries can redeem items
    if (req.user.role !== 'beneficiary') {
      return res.status(403).json({ message: 'Only beneficiaries can redeem items' });
    }

    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!item.isActive) {
      return res.status(400).json({ message: 'Item is not available' });
    }

    // get quantity from request body, default to 1
    const requestedQuantity = Number(req.body.quantity) || 1;
    
    // validate quantity: must be between 1 and 5
    if (requestedQuantity < 1 || requestedQuantity > 5) {
      return res.status(400).json({ message: 'Quantity must be between 1 and 5' });
    }

    // calculate available quantity
    const availableQuantity = item.quantity - (item.reservedQuantity || 0);
    
    if (availableQuantity <= 0) {
      return res.status(400).json({ message: 'Item is out of stock' });
    }

    if (requestedQuantity > availableQuantity) {
      return res.status(400).json({ message: `Insufficient stock. Only ${availableQuantity} available (${item.quantity} total, ${item.reservedQuantity || 0} reserved).` });
    }

    // get beneficiary user
    const beneficiary = await User.findById(req.user.id);
    if (!beneficiary) {
      return res.status(404).json({ message: 'User not found' });
    }

    const price = item.tokenPrice;
    const totalPrice = price * requestedQuantity;

    // check balance if sufficient
    if (beneficiary.tokenBalance < totalPrice) {
      return res.status(400).json({ message: `Insufficient token balance. Need ${totalPrice} tokens, but you have ${beneficiary.tokenBalance}.` });
    }

    // get item owner
    const member = await User.findById(item.owner._id);
    if (!member) {
      return res.status(404).json({ message: 'Item owner not found' });
    }

    // deduct from beneficiary
    const decResult = await User.updateOne(
      { _id: beneficiary._id },
      { $inc: { tokenBalance: -totalPrice } }
    );

    // show many models were updated? if 0, then failed to deduct tokens
    if (decResult.modifiedCount === 0) {
      return res.status(400).json({ message: 'Failed to deduct tokens' });
    }

    // reserve quantity
    await Item.updateOne(
      { _id: item._id },
      { $inc: { reservedQuantity: requestedQuantity } }
    );

    // create pending transaction
    const transaction = await Transaction.create({
      fromUser: beneficiary._id,
      toUser: member._id,
      amount: totalPrice,
      quantity: requestedQuantity,
      status: 'pending', // set as pending, waiting for member approval
      item: item._id,
      message: `Redeem request for ${requestedQuantity} x ${item.name}`,
      processedAt: null // will be set when member accepts/rejects
    });

    await transaction.populate('toUser', 'name email');
    await transaction.populate('item', 'name category type description tokenPrice quantity');

    res.status(201).json({
      message: 'Redemption request submitted. Waiting for member approval.',
      transaction,
      newBalance: beneficiary.tokenBalance - totalPrice,
      status: 'pending',
      quantity: requestedQuantity,
      totalPrice: totalPrice
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = itemRouter;