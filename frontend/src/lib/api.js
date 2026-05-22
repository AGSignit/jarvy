// Uses VITE_API_URL (Render URL) in production, Vite proxy in dev.
const BASE = import.meta.env.VITE_API_URL || '/api'

// Keep Render free-tier warm (spins down after 15 min)
const _ping = () => fetch(BASE + '/health', { method: 'GET' }).catch(() => {})
_ping()
setInterval(_ping, 8 * 60 * 1000)

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
