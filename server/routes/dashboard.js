const express = require('express');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/admin', auth, admin, async (_req, res) => {
  const [events, users, registrations, byCategory] = await Promise.all([
    Event.countDocuments(),
    User.countDocuments(),
    Registration.countDocuments({ status: 'registered' }),
    Event.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const upcoming = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5);
  res.json({ events, users, registrations, byCategory, upcoming });
});

router.get('/student', auth, async (req, res) => {
  const registrations = await Registration.find({ user: req.user._id, status: 'registered' }).populate('event');
  res.json({ registrations });
});

module.exports = router;
