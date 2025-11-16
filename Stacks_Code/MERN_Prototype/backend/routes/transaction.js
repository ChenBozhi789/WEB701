const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Item = require('../models/Item');
const { requireAuth } = require('../middleware/auth');

// get all pending transactions for the current member
router.get('/pending', requireAuth, async (req, res) => {
  try {
    // only members can see pending transactions for their items
    if (req.user.role !== 'member') {
      return res.status(403).json({ message: 'Only members can view pending transactions' });
    }

    // find all pending transactions where the current user is the receiver (toUser)
    const transactions = await Transaction.find({
      toUser: req.user.id,
      status: 'pending'
    })
      .populate('fromUser', 'name email')
      .populate('item', 'name category type description tokenPrice quantity')
      .sort({ createdAt: -1 }); // newest first

    res.json(transactions);
  } catch (err) {
    console.error('Get pending transactions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// accept transaction
router.post('/:id/accept', requireAuth, async (req, res) => {
  try {
    // only members can accept transactions for their own items
    if (req.user.role !== 'member') {
      return res.status(403).json({ message: 'Only members can accept transactions for their own items' });
    }

    const transaction = await Transaction.findById(req.params.id)
      .populate('item')
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // check if transaction is pending
    if (transaction.status !== 'pending') {
      return res.status(400).json({ 
        message: `Transaction is already ${transaction.status}` 
      });
    }

    // verify the current user is the receiver of the transaction
    if (String(transaction.toUser._id) !== String(req.user.id)) {
      return res.status(403).json({ 
        message: 'You can only accept transactions for your own items' 
      });
    }

    // verify item exists and is active
    if (!transaction.item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!transaction.item.isActive) {
      return res.status(400).json({ message: 'Item is not active' });
    }

    // check if item still has available quantity (considering reserved quantity)
    const availableQuantity = transaction.item.quantity - (transaction.item.reservedQuantity || 0);
    if (availableQuantity < transaction.quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${availableQuantity} available, but ${transaction.quantity} requested.` 
      });
    }

    // verify beneficiary still has enough balance
    const beneficiary = await User.findById(transaction.fromUser._id);
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found' });
    }

    // add tokens to member (receiver)
    const member = await User.findById(transaction.toUser._id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // perform the transfer: tokens are already deducted from beneficiary, now add to member
    await User.updateOne(
      { _id: member._id },
      { $inc: { tokenBalance: transaction.amount } }
    );

    // decrease item quantity and reservedQuantity by the transaction quantity
    await Item.updateOne(
      { _id: transaction.item._id },
      { 
        $inc: { 
          quantity: -transaction.quantity,
          reservedQuantity: -transaction.quantity 
        } 
      }
    );

    // update transaction status
    transaction.status = 'accepted';
    transaction.processedAt = new Date();
    await transaction.save();

    // populate for response
    await transaction.populate('fromUser', 'name email');
    await transaction.populate('item', 'name category type description tokenPrice quantity');

    res.json({
      message: 'Transaction accepted successfully',
      transaction,
      newBalance: member.tokenBalance + transaction.amount
    });
  } catch (err) {
    console.error('Accept transaction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// reject transaction
router.post('/:id/reject', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'member') {
      return res.status(403).json({ message: 'Only members can reject transactions' });
    }

    const transaction = await Transaction.findById(req.params.id)
      .populate('item')
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // check if transaction is pending
    if (transaction.status !== 'pending') {
      return res.status(400).json({ 
        message: `Transaction is already ${transaction.status}` 
      });
    }

    // verify that the current user is the receiver (toUser)
    if (String(transaction.toUser._id) !== String(req.user.id)) {
      return res.status(403).json({ 
        message: 'You can only reject transactions for your own items' 
      });
    }

    // get beneficiary to refund tokens
    const beneficiary = await User.findById(transaction.fromUser._id);
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found' });
    }

    // refund tokens to beneficiary (restore balance)
    await User.updateOne(
      { _id: beneficiary._id },
      { $inc: { tokenBalance: transaction.amount } }
    );

    // release reserved quantity (decrease reservedQuantity, but keep quantity unchanged)
    await Item.updateOne(
      { _id: transaction.item._id },
      { $inc: { reservedQuantity: -transaction.quantity } }
    );

    // update transaction status
    transaction.status = 'rejected';
    transaction.processedAt = new Date();
    await transaction.save();

    // populate for response
    await transaction.populate('fromUser', 'name email');
    await transaction.populate('item', 'name category type description tokenPrice quantity');

    res.json({
      message: 'Transaction rejected successfully. Tokens have been refunded to beneficiary.',
      transaction
    });
  } catch (err) {
    console.error('Reject transaction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// get all transaction history for current user
router.get('/history', requireAuth, async (req, res) => {
  try {
    // get all transactions where user is either sender or receiver
    const transactions = await Transaction.find({
      $or: [
        { fromUser: req.user.id },
        { toUser: req.user.id }
      ]
    })
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .populate('item', 'name category type')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error('Get transaction history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

