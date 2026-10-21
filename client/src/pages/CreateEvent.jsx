import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles, Save } from 'lucide-react';
import { eventsAPI, aiAPI } from '../api';

const empty = {
  title: '',
  description: '',
  date: '',
  endDate: '',
  venue: '',
  capacity: 100,
  category: 'Technical',
  tags: '',
  status: 'upcoming',
};

export default function CreateEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    eventsAPI.get(id).then(({ data }) => {
      setForm({
        title: data.title || '',
        description: data.description || '',
        date: data.date ? data.date.slice(0, 16) : '',
        endDate: data.endDate ? data.endDate.slice(0, 16) : '',
        venue: data.venue || '',
        capacity: data.capacity || 100,
        category: data.category || 'Technical',
        tags: (data.tags || []).join(', '),
        status: data.status || 'upcoming',
      });
    });
  }, [id]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function generateDescription() {
    if (!form.title) return toast.error('Add a title first');
    try {
      const { data } = await aiAPI.describe({
        title: form.title,
        category: form.category,
        venue: form.venue,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setField('description', data.description);
      toast.success('Description generated');
    } catch {
      toast.error('Could not generate description');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);
      if (id) await eventsAPI.update(id, fd);
      else await eventsAPI.create(fd);
      toast.success(id ? 'Event updated' : 'Event created');
      navigate('/events');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">{id ? 'Edit event' : 'Create event'}</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <div className="flex justify-end">
          <button type="button" onClick={generateDescription} className="inline-flex items-center gap-2 text-sm text-indigo-600">
            <Sparkles size={16} /> AI Generate description
          </button>
        </div>
        <textarea
          rows={4}
          placeholder="Description"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Start
            <input
              type="datetime-local"
              required
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="text-sm">
            End
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setField('endDate', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
        </div>
        <input
          required
          placeholder="Venue"
          value={form.venue}
          onChange={(e) => setField('venue', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="number"
            min="1"
            value={form.capacity}
            onChange={(e) => setField('capacity', e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          >
            {['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Social'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <input
          placeholder="Tags (comma separated)"
          value={form.tags}
          onChange={(e) => setField('tags', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-white">
          <Save size={16} /> {saving ? 'Saving...' : 'Save event'}
        </button>
      </form>
    </div>
  );
}
