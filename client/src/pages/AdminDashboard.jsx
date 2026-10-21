import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardAPI.admin().then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (!stats) return <p className="p-10 text-center">Loading dashboard...</p>;

  const cards = [
    ['Events', stats.events],
    ['Users', stats.users],
    ['Registrations', stats.registrations],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin dashboard</h1>
        <Link to="/create-event" className="rounded-xl bg-indigo-600 px-4 py-2 text-white">
          New event
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-10 text-xl font-semibold">By category</h2>
      <ul className="mt-3 space-y-2">
        {(stats.byCategory || []).map((c) => (
          <li key={c._id} className="flex justify-between rounded-xl bg-slate-100 px-4 py-2 dark:bg-slate-800">
            <span>{c._id}</span>
            <span>{c.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
