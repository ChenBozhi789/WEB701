const express = require('express');
const bcrypt = require('bcryptjs');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const authRouter = express.Router();

// helper: set httpOnly cookie
function setJwtCookie(res, token){
  // use cookie header to avoid extra dep; you also installed cookie-parser below
  res.setHeader('Set-Cookie', cookie.serialize('jwt', token, {
    httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7*24*3600, path: '/'
  }));
}

// register
authRouter.post('/register', async (req, res) => {
  try {
    // get user info from request body
    const { name, email, password, role } = req.body;
    
    // validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, email, password, role' 
      });
    }
    
    // validate role
    if (!["member", "beneficiary"].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "member" or "beneficiary"' });
    }
    
    // validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // validate password length
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // validate name
    if (String(name).trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }
    
    // check if email already exists
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    
    // hash password
    const passwordHash = await bcrypt.hash(String(password), 10);
    
    // create user
    const user = await User.create({ 
      name: String(name).trim(), 
      email: String(email).toLowerCase().trim(), 
      passwordHash, 
      role,
      tokenBalance: 50 // explicitly set initial balance
    });
    
    // return user info (without password)
    res.status(201).json({ 
      id: user._id, 
      name: user.name,
      email: user.email, 
      role: user.role,
      tokenBalance: user.tokenBalance,
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) { // MongoDB duplicate key error
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // find user with passwordHash (select: false field)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // verify password
    const ok = await user.verifyPassword(String(password));
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // generate JWT token
    const token = jwt.sign(
      { sub: String(user._id), role: user.role }, 
      process.env.JWT_SECRET || "dev_secret", 
      { expiresIn: "7d" }
    );
    
    // return token and user info
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        tokenBalance: user.tokenBalance
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});


// get me
authRouter.get('/me', requireAuth, async (req,res)=>{
  const me = await User.findById(req.user.id).select('_id name email role tokenBalance hasClaimedInitialTokens');
  res.json(me);
});

// logout
authRouter.post('/logout', (_req,res)=>{
  setJwtCookie(res, ''); res.json({ ok:true });
});

// change password
authRouter.post('/change-password', requireAuth, async (req, res) => {
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

// update profile (name)
authRouter.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name } = req.body || {};

    // validation
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    // get user
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // update name
    user.name = String(name).trim();
    await user.save();

    // return updated user info
    return res.json({
      ok: true,
      message: 'Name updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tokenBalance: user.tokenBalance
      }
    });
  } catch (err) {
    console.error('update-profile error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = authRouter;