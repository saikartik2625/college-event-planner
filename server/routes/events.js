const express = require('express');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { auth, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createNotification } = require('../services/notifications');

const router = express.Router();

function withCounts(events, counts) {
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  return events.map((event) => {
    const obj = event.toObject();
    obj.registeredCount = map.get(String(event._id)) || 0;
    return obj;
  });
}

router.get('/', async (req, res) => {
  try {
    const { category, q, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (q) filter.title = { $regex: q, $options: 'i' };

    const events = await Event.find(filter).populate('createdBy', 'name email').sort({ date: 1 });
    const counts = await Registration.aggregate([
      { $match: { status: 'registered' } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
    ]);
    res.json(withCounts(events, counts));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load events' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const registeredCount = await Registration.countDocuments({ event: event._id, status: 'registered' });
    res.json({ ...event.toObject(), registeredCount });
  } catch (err) {
    res.status(400).json({ message: 'Invalid event id' });
  }
});

router.post('/', auth, admin, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, endDate, venue, capacity, category, tags, status } = req.body;
    if (!title || !date || !venue) {
      return res.status(400).json({ message: 'Title, date and venue are required' });
    }
    const event = await Event.create({
      title,
      description,
      date,
      endDate: endDate || undefined,
      venue,
      capacity: Number(capacity) || 100,
      category: category || 'Social',
      tags: typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : tags || [],
      status: status || 'upcoming',
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image || '',
      createdBy: req.user._id,
    });

    const students = await User.find({ role: 'student' }).select('_id');
    await Promise.all(
      students.map((student) =>
        createNotification({
          io: req.app.get('io'),
          userId: student._id,
          title: 'New event',
          message: `${event.title} was just published`,
          type: 'event',
          event: event._id,
        })
      )
    );
    req.app.get('io')?.emit('new-event', event);
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

router.put('/:id', auth, admin, upload.single('image'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const fields = ['title', 'description', 'date', 'endDate', 'venue', 'capacity', 'category', 'status'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== '') event[field] = req.body[field];
    });
    if (req.body.tags !== undefined) {
      event.tags =
        typeof req.body.tags === 'string'
          ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : req.body.tags;
    }
    if (req.file) event.image = `/uploads/${req.file.filename}`;
    await event.save();
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await Registration.deleteMany({ event: event._id });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

module.exports = router;
