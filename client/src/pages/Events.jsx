import { useEffect, useState } from 'react';
import { eventsAPI } from '../api';
import EventCard from '../components/EventCard';

const CATEGORIES = ['', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Social'];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    eventsAPI.list({ q, category }).then(({ data }) => setEvents(data)).catch(() => setEvents([]));
  }, [q, category]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Events</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events"
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c || 'All categories'}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>
      {events.length === 0 && <p className="mt-8 text-slate-500">No events match your filters.</p>}
    </div>
  );
}
