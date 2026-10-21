import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, Moon, Sun, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

export default function Navbar({ socket }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <CalendarDays className="text-indigo-600" />
          Basee
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/events" className={linkClass}>
            Events
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <>
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
              <NavLink to="/create-event" className={linkClass}>
                Create
              </NavLink>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={toggleDarkMode} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user && <NotificationBell socket={socket} />}
          {user ? (
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="hidden rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-slate-900 md:block"
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="hidden rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white md:block">
              Login
            </Link>
          )}
          <button className="md:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="flex flex-col gap-1 px-4 pb-4 md:hidden">
          <NavLink to="/" className={linkClass} onClick={() => setOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/events" className={linkClass} onClick={() => setOpen(false)}>
            Events
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
              Dashboard
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
              Admin
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
}
