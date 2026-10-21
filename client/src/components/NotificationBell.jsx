import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationsAPI } from '../api';

export default function NotificationBell({ socket }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  async function load() {
    try {
      const { data } = await notificationsAPI.list();
      setItems(data);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (notification) => setItems((prev) => [notification, ...prev]);
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              className="text-xs text-indigo-500"
              onClick={async () => {
                await notificationsAPI.readAll();
                load();
              }}
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="p-4 text-sm text-slate-500">No notifications yet.</p>}
            {items.map((n) => (
              <button
                key={n._id}
                className={`block w-full px-3 py-2 text-left text-sm ${n.read ? 'opacity-70' : 'bg-indigo-50 dark:bg-indigo-950/40'}`}
                onClick={async () => {
                  await notificationsAPI.read(n._id);
                  load();
                }}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-slate-500">{n.message}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
