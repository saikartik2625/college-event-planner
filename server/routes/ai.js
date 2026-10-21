const express = require('express');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');
const { generateDescription, suggestSchedule, getRecommendations, chat } = require('../services/openai');

const router = express.Router();

router.post('/describe', auth, async (req, res) => {
  try {
    const description = await generateDescription(req.body);
    res.json({ description });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate description' });
  }
});

router.post('/schedule', auth, async (req, res) => {
  try {
    const schedule = await suggestSchedule(req.body);
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to suggest schedule' });
  }
});

router.get('/recommend', auth, async (req, res) => {
  try {
    const events = await Event.find({ status: { $ne: 'cancelled' }, date: { $gte: new Date() } }).sort({ date: 1 });
    const recommendations = await getRecommendations({ interests: req.user.interests || [], events });
    res.json(recommendations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to recommend events' });
  }
});

router.post('/chat', auth, async (req, res) => {
  try {
    const events = await Event.find({ status: { $ne: 'cancelled' } }).sort({ date: 1 }).limit(20);
    const reply = await chat({ message: req.body.message || '', events });
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Chat failed' });
  }
});

module.exports = router;
