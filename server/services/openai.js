const OpenAI = require('openai');

function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
}

function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');
}

function isConfigured() {
  return isGeminiConfigured() || isOpenAIConfigured();
}

async function callGemini({ system, prompt, json = false }) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.AI_MODEL || 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: (system ? `System: ${system}\n\n` : '') + prompt }],
      },
    ],
  };

  if (json) {
    body.generationConfig = { responseMimeType: 'application/json' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(7000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}

function parseJsonSafe(raw) {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function localDescription({ title, category, venue, tags }) {
  return `${title} is a ${category || 'campus'} event at ${venue || 'the college'}. ${
    tags?.length ? `Focus areas: ${tags.join(', ')}.` : ''
  } Join fellow students for an engaging session with activities, networking, and takeaways you can use after the event.`;
}

async function generateDescription({ title, category, venue, tags }) {
  if (!isConfigured()) {
    return localDescription({ title, category, venue, tags });
  }

  try {
    if (isGeminiConfigured()) {
      return await callGemini({
        system: 'Write a short, inviting college event description in 2-3 sentences. No markdown.',
        prompt: `Title: ${title}\nCategory: ${category}\nVenue: ${venue}\nTags: ${(tags || []).join(', ')}`,
      });
    }

    const completion = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Write a short, inviting college event description in 2-3 sentences. No markdown.' },
        { role: 'user', content: `Title: ${title}\nCategory: ${category}\nVenue: ${venue}\nTags: ${(tags || []).join(', ')}` },
      ],
    });
    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.warn('⚠️ AI request failed (' + err.message + '). Using local fallback.');
    return localDescription({ title, category, venue, tags });
  }
}

function localSchedule({ title, category }) {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(16, 0, 0, 0);
  const end = new Date(date);
  end.setHours(18, 0, 0, 0);
  return {
    date: date.toISOString(),
    endDate: end.toISOString(),
    reason: `Suggested a weekday evening slot next week for ${title || category || 'this event'}.`,
  };
}

async function suggestSchedule({ title, category }) {
  if (!isConfigured()) {
    return localSchedule({ title, category });
  }

  try {
    if (isGeminiConfigured()) {
      const text = await callGemini({
        system: 'Return JSON only with date, endDate (ISO strings) and reason for a campus event.',
        prompt: `Suggest a schedule for ${title} (${category}) in the next 2 weeks.`,
        json: true,
      });
      return parseJsonSafe(text) || localSchedule({ title, category });
    }

    const completion = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Return JSON only with date, endDate (ISO strings) and reason for a campus event.' },
        { role: 'user', content: `Suggest a schedule for ${title} (${category}) in the next 2 weeks.` },
      ],
      response_format: { type: 'json_object' },
    });
    return parseJsonSafe(completion.choices[0].message.content) || localSchedule({ title, category });
  } catch (err) {
    console.warn('⚠️ AI request failed (' + err.message + '). Using local fallback.');
    return localSchedule({ title, category });
  }
}

function localRecommendations({ interests, events }) {
  const lower = (interests || []).map((i) => i.toLowerCase());
  const scored = events.map((event) => {
    const hay = `${event.title} ${event.category} ${(event.tags || []).join(' ')}`.toLowerCase();
    const score = lower.filter((i) => hay.includes(i)).length;
    return { event, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.event);
}

async function getRecommendations({ interests, events }) {
  if (!events.length) return [];
  if (!isConfigured()) {
    return localRecommendations({ interests, events });
  }

  try {
    let ids = [];
    if (isGeminiConfigured()) {
      const text = await callGemini({
        system: 'Pick up to 5 event IDs that match student interests. Return JSON { ids: string[] }.',
        prompt: JSON.stringify({
          interests,
          events: events.map((e) => ({ id: e._id, title: e.title, category: e.category, tags: e.tags })),
        }),
        json: true,
      });
      const parsed = parseJsonSafe(text) || {};
      ids = parsed.ids || [];
    } else {
      const completion = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Pick up to 5 event IDs that match student interests. Return JSON { ids: string[] }.' },
          {
            role: 'user',
            content: JSON.stringify({
              interests,
              events: events.map((e) => ({ id: e._id, title: e.title, category: e.category, tags: e.tags })),
            }),
          },
        ],
        response_format: { type: 'json_object' },
      });
      const parsed = parseJsonSafe(completion.choices[0].message.content) || {};
      ids = parsed.ids || [];
    }

    const map = new Map(events.map((e) => [String(e._id), e]));
    const matched = ids.map((id) => map.get(String(id))).filter(Boolean);
    return matched.length ? matched : localRecommendations({ interests, events });
  } catch (err) {
    console.warn('⚠️ AI request failed (' + err.message + '). Using local fallback.');
    return localRecommendations({ interests, events });
  }
}

function localChat({ message, events }) {
  const q = message.toLowerCase();
  const match = events.find((e) => e.title.toLowerCase().includes(q.split(' ')[0]));
  if (match) {
    return `${match.title} is on ${new Date(match.date).toLocaleString()} at ${match.venue}. Category: ${match.category}.`;
  }
  if (!events.length) return 'There are no upcoming events yet. Check back soon or ask an admin to create one.';
  const next = events[0];
  return `Upcoming highlight: ${next.title} at ${next.venue} on ${new Date(next.date).toLocaleString()}. Ask me about a specific event name for details.`;
}

async function chat({ message, events }) {
  if (!isConfigured()) {
    return localChat({ message, events });
  }

  try {
    if (isGeminiConfigured()) {
      return await callGemini({
        system: 'You are a friendly campus event assistant. Answer briefly in 1-2 sentences using the event list. If unsure, say so.',
        prompt: `Events: ${JSON.stringify(
          events.map((e) => ({ title: e.title, date: e.date, venue: e.venue, category: e.category }))
        )}\nQuestion: ${message}`,
      });
    }

    const completion = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a campus event assistant. Answer briefly using the event list. If unsure, say so.',
        },
        {
          role: 'user',
          content: `Events: ${JSON.stringify(
            events.map((e) => ({ title: e.title, date: e.date, venue: e.venue, category: e.category }))
          )}\nQuestion: ${message}`,
        },
      ],
    });
    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.warn('⚠️ AI request failed (' + err.message + '). Using local fallback.');
    return localChat({ message, events });
  }
}

module.exports = { generateDescription, suggestSchedule, getRecommendations, chat };
