import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { aiAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi! Ask me about upcoming campus events.' }]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  if (!user) return null;

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const { data } = await aiAPI.chat(text);
      setMessages((m) => [...m, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'I could not answer that right now.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-3 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between bg-indigo-600 px-3 py-2 text-white">
            <span className="text-sm font-semibold">Event assistant</span>
            <button onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  m.role === 'user' ? 'ml-auto bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="max-w-[85%] rounded-xl px-3 py-2 bg-slate-100 text-slate-500 dark:bg-slate-800 text-xs animate-pulse">
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-2 dark:border-slate-800">
            <input
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-sm dark:border-slate-700 disabled:opacity-50"
              placeholder={loading ? 'Waiting for AI...' : 'Ask about events...'}
            />
            <button disabled={loading} className="rounded-lg bg-indigo-600 p-2 text-white disabled:opacity-50">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-indigo-600 p-4 text-white shadow-lg hover:bg-indigo-500"
      >
        <MessageCircle size={22} />
      </button>
    </div>
  );
}
