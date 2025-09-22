const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const r = express.Router();

// helper: set httpOnly cookie
function setJwtCookie(res, token){
  // use cookie header to avoid extra dep; you also installed cookie-parser below
  res.setHeader('Set-Cookie', cookie.serialize('jwt', token, {
    httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7*24*3600, path: '/'
  }));
}

// register
r.post('/register', async (req,res)=>{
  const { name, email, password, role } = req.body;
  if(!["member","beneficiary"].includes(role)) return res.status(400).json({message:"Invalid role"});
  const exists = await User.findOne({email});
  if(exists) return res.status(409).json({message:"Email exists"});
  const passwordHash = await bcrypt.hash(password, 10);
  const u = await User.create({ name, email, passwordHash, role });
  res.status(201).json({ id: u._id, email: u.email, role: u.role });
});

// login
r.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // pick up the hidden field
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) return res.status(401).json({ message: "Bad credentials" });

  const ok = await user.verifyPassword(password); // or bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ message: "Bad credentials" });

  const token = jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  // set cookie if you use cookies, and/or return token
  res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
});


// get me
r.get('/me', requireAuth, async (req,res)=>{
  const me = await User.findById(req.user.id).select('_id name email role tokenBalance');
  res.json(me);
});

// logout
r.post('/logout', (_req,res)=>{
  setJwtCookie(res, ''); res.json({ ok:true });
});

// change password
r.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};

    // basic validation
    if (!oldPassword || !newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: 'Invalid input (new password min length 6)' });
    }

    // load current user WITH passwordHash for verification
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // verify old password
    // model already has verifyPassword used in /login
    const ok = await user.verifyPassword(oldPassword);
    if (!ok) return res.status(400).json({ message: 'Old password incorrect' });

    // save new password
    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    // simplest UX: ask client to re-login
    return res.json({ ok: true, message: 'Password updated. Please log in again.' });
  } catch (err) {
    console.error('change-password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


module.exports = r;