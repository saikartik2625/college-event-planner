import { useEffect, useState } from 'react';
import { dashboardAPI, aiAPI, authAPI } from '../api';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user, setUser } = useAuth();
  const [regs, setRegs] = useState([]);
  const [recs, setRecs] = useState([]);
  const [interests, setInterests] = useState((user?.interests || []).join(', '));

  useEffect(() => {
    dashboardAPI.student().then(({ data }) => setRegs(data.registrations || [])).catch(() => {});
    aiAPI.recommend().then(({ data }) => setRecs(data || [])).catch(() => {});
  }, []);

  async function saveInterests(e) {
    e.preventDefault();
    const { data } = await authAPI.updateMe({
      interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setUser(data.user);
    const rec = await aiAPI.recommend();
    setRecs(rec.data || []);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Hi {user?.name}</h1>
      <p className="text-slate-500">Your registrations and recommended events.</p>

      <form onSubmit={saveInterests} className="mt-6 flex max-w-xl gap-2">
        <input
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="Interests: Technical, Cultural..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <button className="rounded-xl bg-indigo-600 px-4 py-2 text-white">Save</button>
      </form>

      <h2 className="mt-10 text-xl font-semibold">Registered</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {regs.map((r) => r.event && <EventCard key={r._id} event={r.event} />)}
      </div>
      {regs.length === 0 && <p className="mt-3 text-sm text-slate-500">You have not registered for any events yet.</p>}

      <h2 className="mt-10 text-xl font-semibold">Recommended for you</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {recs.map((event) => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>
    </div>
  );
}
