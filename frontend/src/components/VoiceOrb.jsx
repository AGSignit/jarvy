import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'

export default function VoiceOrb({ listening, thinking, onClick, disabled }) {
  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className="relative w-40 h-40 rounded-full focus:outline-none disabled:opacity-40"
      >
        {/* halo */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(94,234,212,0.35) 0%, rgba(94,234,212,0) 70%)',
          }}
          animate={{ scale: listening || thinking ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        {/* ring */}
        <motion.div
          className="absolute inset-3 rounded-full border-2 border-jarvy-accent/50"
          animate={{ rotate: thinking ? 360 : 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-6 rounded-full border border-jarvy-accent2/40"
          animate={{ rotate: thinking ? -360 : 0 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />
        {/* core */}
        <div className="absolute inset-10 rounded-full bg-gradient-to-br from-jarvy-accent/30 to-jarvy-accent2/20 flex items-center justify-center shadow-glow">
          {listening
            ? <Mic className="text-jarvy-accent" size={28} />
            : <MicOff className="text-white/60" size={28} />}
        </div>
      </button>
      <div className="mt-3 text-xs uppercase tracking-widest text-white/50 font-mono">
        {thinking ? 'thinking' : listening ? 'listening' : 'idle'}
      </div>
    </div>
  )
}
