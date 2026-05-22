import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'

export default function Sidebar() {
  const [facts, setFacts] = useState([])
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [status, setStatus] = useState(null)

  async function refresh() {
    try {
      const f = await api.facts()
      setFacts(f.facts || [])
      const s = await api.status()
      setStatus(s)
    } catch {}
  }

  useEffect(() => { refresh() }, [])

  async function addFact() {
    if (!key.trim() || !value.trim()) return
    await api.addFact(key.trim(), value.trim())
    setKey(''); setValue('')
    refresh()
  }

  async function removeFact(k) {
    await api.addFact(k, '')
    refresh()
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass rounded-xl p-4 flex flex-col gap-4 h-full overflow-y-auto"
    >
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50 font-mono mb-2">
          identity
        </div>
        <div className="text-sm">
          <div className="text-white/90 font-medium">{status?.assistant_name || 'Jarvy'}</div>
          <div className="text-white/50 text-xs">user: {status?.user_name || '—'}</div>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-white/50 font-mono mb-2">
          security
        </div>
        <div className="text-xs space-y-1 font-mono">
          <div>shell: <span className={status?.allow_shell ? 'text-jarvy-accent' : 'text-white/50'}>
            {status?.allow_shell ? 'enabled' : 'disabled'}
          </span></div>
          <div>confirm gate: <span className={status?.require_confirm_unsafe ? 'text-jarvy-accent' : 'text-jarvy-danger'}>
            {status?.require_confirm_unsafe ? 'on' : 'off'}
          </span></div>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-white/50 font-mono mb-2">
          plugins
        </div>
        <div className="flex flex-wrap gap-1">
          {(status?.plugins || []).map((p) => (
            <span key={p} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-jarvy-accent/15 text-jarvy-accent border border-jarvy-accent/20">
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="text-xs uppercase tracking-widest text-white/50 font-mono mb-2">
          facts
        </div>
        <div className="flex gap-1 mb-2">
          <input
            placeholder="key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-jarvy-accent/60"
          />
          <input
            placeholder="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-jarvy-accent/60"
          />
          <button
            onClick={addFact}
            className="px-2 rounded bg-jarvy-accent/20 hover:bg-jarvy-accent/30 border border-jarvy-accent/30"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {facts.filter((f) => f.value).map((f) => (
            <div key={f.key} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-white/5 group">
              <div className="truncate">
                <span className="text-jarvy-accent">{f.key}</span>{' '}
                <span className="text-white/70">→ {f.value}</span>
              </div>
              <button
                onClick={() => removeFact(f.key)}
                className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-jarvy-danger"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {facts.filter((f) => f.value).length === 0 && (
            <div className="text-xs text-white/40">No facts yet.</div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
