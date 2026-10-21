const Notification = require('../models/Notification');

async function createNotification({ io, userId, title, message, type = 'system', event }) {
  const notification = await Notification.create({ user: userId, title, message, type, event });
  if (io) io.to(String(userId)).emit('notification', notification);
  return notification;
}

module.exports = { createNotification };
