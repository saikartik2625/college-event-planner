import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Users } from 'lucide-react';
import { eventsAPI, registrationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [mine, setMine] = useState(false);

  async function load() {
    const { data } = await eventsAPI.get(id);
    setEvent(data);
    if (user) {
      const regs = await registrationsAPI.mine();
      setMine(regs.data.some((r) => r.event?._id === id));
    }
  }

  useEffect(() => {
    load().catch(() => setEvent(null));
  }, [id, user]);

  if (!event) return <p className="p-10 text-center">Loading event...</p>;

  async function register() {
    if (!user) return navigate('/login');
    try {
      await registrationsAPI.register(id);
      toast.success('Registered');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not register');
    }
  }

  async function cancel() {
    await registrationsAPI.cancel(id);
    toast.success('Cancelled');
    load();
  }

  async function remove() {
    if (!confirm('Delete this event?')) return;
    await eventsAPI.remove(id);
    toast.success('Deleted');
    navigate('/events');
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="h-56 bg-gradient-to-r from-indigo-500 to-violet-500">
          {event.image ? <img src={event.image} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm font-semibold uppercase text-indigo-500">{event.category}</p>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="text-slate-600 dark:text-slate-300">{event.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Calendar size={16} /> {new Date(event.date).toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={16} /> {event.venue}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users size={16} /> {event.registeredCount}/{event.capacity}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            {mine ? (
              <button onClick={cancel} className="rounded-xl bg-slate-200 px-4 py-2 dark:bg-slate-800">
                Cancel registration
              </button>
            ) : (
              <button onClick={register} className="rounded-xl bg-indigo-600 px-4 py-2 text-white">
                Register
              </button>
            )}
            {user?.role === 'admin' && (
              <>
                <Link to={`/edit-event/${event._id}`} className="rounded-xl border px-4 py-2">
                  Edit
                </Link>
                <button onClick={remove} className="rounded-xl bg-rose-600 px-4 py-2 text-white">
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
