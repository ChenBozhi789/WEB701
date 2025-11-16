const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { requireAuth } = require('../middleware/auth');

const tokenRouter = express.Router();

// beneficiaries can claim initial tokens
tokenRouter.post('/claim-initial', requireAuth, async (req, res) => {
  try {
    // only beneficiaries can claim initial tokens
    if (req.user.role !== 'beneficiary') {
      return res.status(403).json({ message: 'Only beneficiaries can claim initial tokens' });
    }

    // get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // check if already claimed
    if (user.hasClaimedInitialTokens) {
      return res.status(400).json({ message: 'Initial tokens have already been claimed' });
    }

    // add 50 tokens and mark as claimed
    const INITIAL_TOKENS = 50;
    await User.updateOne(
      { _id: user._id },
      { 
        $inc: { tokenBalance: INITIAL_TOKENS },
        $set: { hasClaimedInitialTokens: true }
      }
    );

    // get updated user
    const updatedUser = await User.findById(req.user.id);

    return res.status(200).json({
      ok: true,
      message: `Successfully claimed ${INITIAL_TOKENS} initial tokens`,
      tokenBalance: updatedUser.tokenBalance
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// transfer tokens directly
tokenRouter.post('/transfer-direct', requireAuth, async (req, res) => {
  try {
    const { toEmail, amount } = req.body;
    const amt = Number(amount);

    // basic validation
    if (!toEmail || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: 'Provide toEmail and a positive amount' });
    }

    // gets sender
    const sender = await User.findById(req.user.id);
    if (!sender) return res.status(404).json({ message: 'Sender not found' });

    // gets receiver by email
    const receiver = await User.findOne({ email: String(toEmail).toLowerCase() });
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

    // no self transfer
    if (String(receiver._id) === String(sender._id)) {
      return res.status(400).json({ message: 'You cannot transfer to yourself' });
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

module.exports = tokenRouter;