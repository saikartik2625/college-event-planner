import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';

export default function EventCard({ event }) {
  return (
    <Link
      to={`/events/${event._id}`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="h-36 bg-gradient-to-r from-indigo-500 to-violet-500">
        {event.image ? (
          <img src={event.image} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">{event.category}</p>
        <h3 className="text-lg font-semibold">{event.title}</h3>
        <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{event.description}</p>
        <div className="flex flex-wrap gap-3 pt-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Calendar size={14} /> {new Date(event.date).toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} /> {event.venue}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={14} /> {event.registeredCount || 0}/{event.capacity}
          </span>
        </div>
      </div>
    </Link>
  );
}
