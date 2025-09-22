const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const r = express.Router();

// transfer tokens directly
r.post('/transfer-direct', requireAuth, async (req, res) => {
  try {
    const { toUserId, toEmail, amount } = req.body;
    const amt = Number(amount);

    // basic validation
    if ((!toUserId && !toEmail) || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: 'Provide toUserId or toEmail and a positive amount' });
    }

    // gets sender
    const sender = await User.findById(req.user.id);
    if (!sender) return res.status(404).json({ message: 'Sender not found' });

    // gets receiver
    let receiver = null;
    if (toUserId && mongoose.isValidObjectId(toUserId)) {
      receiver = await User.findById(toUserId);
    }
    if (!receiver && toEmail) {
      receiver = await User.findOne({ email: String(toEmail).toLowerCase() });
    }
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

    // no self transfer
    if (String(receiver._id) === String(sender._id)) {
      return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    // check roles
    if (sender.role === 'beneficiary' && receiver.role !== 'member') {
      return res.status(400).json({ message: 'Receiver must be a member when sender is a beneficiary' });
    }
    if (sender.role === 'member' && receiver.role !== 'beneficiary') {
      return res.status(400).json({ message: 'Receiver must be a beneficiary when sender is a member' });
    }

    // remove from sender
    const dec = await User.updateOne(
      { _id: sender._id, tokenBalance: { $gte: amt } },
      { $inc: { tokenBalance: -amt } }
    );
    if (dec.modifiedCount === 0) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // add to receiver
    await User.updateOne({ _id: receiver._id }, { $inc: { tokenBalance: amt } });

    // save record
    const tx = await Transaction.create({
      fromUser: sender._id,
      toUser: receiver._id,
      amount: amt,
      status: 'accepted'
    });

    return res.status(201).json({
      ok: true,
      direction: `${sender.role}->${receiver.role}`,
      tx
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = r;