import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Cpu, Shield, Wifi, WifiOff } from 'lucide-react'
import { api } from '../lib/api'

export default function StatusBar() {
  const [status, setStatus] = useState(null)
  const [online, setOnline] = useState(true)

  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const s = await api.status()
        if (alive) { setStatus(s); setOnline(true) }
      } catch {
        if (alive) setOnline(false)
      }
    }
    tick()
    const id = setInterval(tick, 6000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const Item = ({ icon: Icon, label, value, danger }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/5">
      <Icon size={14} className={danger ? 'text-jarvy-danger' : 'text-jarvy-accent'} />
      <span className="text-[11px] uppercase tracking-wider text-white/50">{label}</span>
      <span className="text-[12px] text-white/90 font-mono">{value}</span>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2"
    >
      <Item
        icon={online ? Wifi : WifiOff}
        label="api"
        value={online ? 'online' : 'offline'}
        danger={!online}
      />
      <Item
        icon={Cpu}
        label="model"
        value={status?.model || '—'}
      />
      <Item
        icon={Shield}
        label="gpt"
        value={status?.openai_configured ? 'configured' : 'no key'}
        danger={!status?.openai_configured}
      />
      <Item
        icon={Activity}
        label="plugins"
        value={status?.plugins?.length ?? 0}
      />
    </motion.div>
  )
}
