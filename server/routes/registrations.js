const express = require('express');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');
const { createNotification } = require('../services/notifications');

const router = express.Router();

router.get('/mine', auth, async (req, res) => {
  const regs = await Registration.find({ user: req.user._id, status: 'registered' }).populate('event');
  res.json(regs);
});

router.post('/:eventId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const existing = await Registration.findOne({ user: req.user._id, event: event._id });
    if (existing && existing.status === 'registered') {
      return res.status(400).json({ message: 'Already registered' });
    }

    const count = await Registration.countDocuments({ event: event._id, status: 'registered' });
    if (count >= event.capacity) return res.status(400).json({ message: 'Event is full' });

    const registration = existing
      ? await Registration.findByIdAndUpdate(existing._id, { status: 'registered' }, { new: true })
      : await Registration.create({ user: req.user._id, event: event._id });

    await createNotification({
      io: req.app.get('io'),
      userId: req.user._id,
      title: 'Registration confirmed',
      message: `You are registered for ${event.title}`,
      type: 'event',
      event: event._id,
    });

    res.status(201).json(registration);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.delete('/:eventId', auth, async (req, res) => {
  const registration = await Registration.findOneAndUpdate(
    { user: req.user._id, event: req.params.eventId },
    { status: 'cancelled' },
    { new: true }
  );
  if (!registration) return res.status(404).json({ message: 'Registration not found' });
  res.json({ message: 'Registration cancelled' });
});

module.exports = router;
