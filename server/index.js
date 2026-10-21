const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cron = require('node-cron');

const Event = require('./models/Event');
const Registration = require('./models/Registration');
const { createNotification } = require('./services/notifications');

const app = express();
const server = http.createServer(app);

const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: { origin: clientOrigins, credentials: true },
});
app.set('io', io);

app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    if (userId) socket.join(String(userId));
  });
});

cron.schedule('0 9 * * *', async () => {
  try {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 1);
    const events = await Event.find({ date: { $gte: start, $lte: end } });
    for (const event of events) {
      const regs = await Registration.find({ event: event._id, status: 'registered' });
      await Promise.all(
        regs.map((reg) =>
          createNotification({
            io,
            userId: reg.user,
            title: 'Event reminder',
            message: `${event.title} is happening soon at ${event.venue}`,
            type: 'reminder',
            event: event._id,
          })
        )
      );
    }
  } catch (err) {
    console.error('Reminder cron error:', err);
  }
});

// Serve production static frontend
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexFile = path.join(clientDist, 'index.html');
  if (require('fs').existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  next();
});

const PORT = Number(process.env.PORT) || 5001;

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('PASTE_YOUR_MONGODB_ATLAS_STRING_HERE')) {
    console.error('❌ Set MONGODB_URI in the root .env file to your Atlas connection string.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start();
