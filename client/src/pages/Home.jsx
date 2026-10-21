import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../api';
import EventCard from '../components/EventCard';

export default function Home() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    eventsAPI.list().then(({ data }) => setEvents(data.slice(0, 6))).catch(() => setEvents([]));
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-100">College Event Planner</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold md:text-5xl">Plan, discover, and join campus events in one place.</h1>
          <p className="mt-4 max-w-xl text-indigo-100">
            Students register in seconds. Admins create events, track attendance, and get AI help writing descriptions.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/events" className="rounded-xl bg-white px-5 py-2.5 font-medium text-indigo-700">
              Browse events
            </Link>
            <Link to="/signup" className="rounded-xl border border-white/40 px-5 py-2.5 font-medium">
              Get started
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Upcoming events</h2>
          <Link to="/events" className="text-sm text-indigo-600">
            View all
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="text-slate-500">No events yet. Sign up as admin to create the first one.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
