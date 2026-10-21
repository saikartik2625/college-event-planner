const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOtpEmail } = require('../services/mail');
const { auth } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    interests: user.interests || [],
    avatar: user.avatar || '',
  };
}

router.get('/config', (_req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  });
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, interests } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role === 'admin' ? 'admin' : 'student',
      interests: interests || [],
    });
    const token = signToken(user._id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid email or password' });

    const token = signToken(user._id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ message: 'Google login is not configured on server' });
    }
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        name: payload.name || 'Google User',
        email: payload.email,
        googleId: payload.sub,
        avatar: payload.picture || '',
        role: 'student',
      });
    } else {
      if (payload.picture && !user.avatar) user.avatar = payload.picture;
      if (payload.sub && !user.googleId) user.googleId = payload.sub;
      await user.save();
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any previous OTPs for this email and save the new one (5 min TTL)
    await OTP.deleteMany({ email: payload.email.toLowerCase() });
    await OTP.create({ email: payload.email.toLowerCase(), otp });

    // Send OTP to user's Gmail
    await sendOtpEmail({ to: payload.email.toLowerCase(), otp });

    res.json({
      requireOtp: true,
      email: payload.email.toLowerCase(),
      message: `Verification code sent to ${payload.email}`,
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(400).json({ message: 'Google authentication failed: ' + err.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    const record = await OTP.findOne({
      email: email.toLowerCase().trim(),
      otp: String(otp).trim(),
    });

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Remove the OTP once used
    await OTP.deleteMany({ email: email.toLowerCase().trim() });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const token = signToken(user._id);
    res.json({ token, user: publicUser(user), message: 'Verification successful' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.deleteMany({ email: email.toLowerCase().trim() });
    await OTP.create({ email: email.toLowerCase().trim(), otp });
    await sendOtpEmail({ to: email.toLowerCase().trim(), otp });

    res.json({ message: 'A new verification code has been sent to your Gmail' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Failed to resend code' });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch('/me', auth, async (req, res) => {
  const { name, interests } = req.body;
  if (name) req.user.name = name;
  if (Array.isArray(interests)) req.user.interests = interests;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
