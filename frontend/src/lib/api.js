// Tiny API client. Uses Vite proxy at /api → backend.
const BASE = '/api'

async function jsonFetch(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  health: () => jsonFetch('/health'),
  status: () => jsonFetch('/status'),
  greet: () => jsonFetch('/greet'),
  history: (limit = 100) => jsonFetch(`/history?limit=${limit}`),
  clearHistory: () => jsonFetch('/history', { method: 'DELETE' }),
  facts: () => jsonFetch('/facts'),
  addFact: (key, value) =>
    jsonFetch('/facts', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    }),
  chat: (message, confirm = false) =>
    jsonFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, confirm }),
    }),
}

export function openChatSocket(onMessage) {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${proto}://${window.location.host}/ws/chat`)
  ws.addEventListener('message', (e) => {
    try { onMessage(JSON.parse(e.data)) } catch {}
  })
  return ws
}
