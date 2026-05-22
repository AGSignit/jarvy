import { motion } from 'framer-motion'
import { Mic, MicOff, Volume2 } from 'lucide-react'

export default function VoiceOrb({ listening, thinking, speaking, onClick, disabled }) {
  const active = listening || thinking || speaking

  const label = thinking ? 'thinking' : speaking ? 'speaking' : listening ? 'listening' : 'idle'

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className="relative w-40 h-40 rounded-full focus:outline-none disabled:opacity-40"
      >
        {/* outer halo — pulses when active */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: speaking
              ? 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, rgba(167,139,250,0) 70%)'
              : 'radial-gradient(circle, rgba(94,234,212,0.35) 0%, rgba(94,234,212,0) 70%)',
          }}
          animate={{ scale: active ? [1, 1.35, 1] : 1 }}
          transition={{
            duration: speaking ? 0.8 : 1.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* outer ring */}
        <motion.div
          className={`absolute inset-3 rounded-full border-2 ${
            speaking ? 'border-purple-400/60' : 'border-jarvy-accent/50'
          }`}
          animate={{ rotate: thinking || speaking ? 360 : 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        {/* inner ring */}
        <motion.div
          className={`absolute inset-6 rounded-full border ${
            speaking ? 'border-purple-300/40' : 'border-jarvy-accent2/40'
          }`}
          animate={{ rotate: thinking || speaking ? -360 : 0 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />

        {/* speaking wave bars */}
        {speaking && (
          <div className="absolute inset-10 rounded-full flex items-center justify-center gap-[3px]">
            {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
              <motion.div
                key={i}
                className="w-[3px] rounded-full bg-purple-400"
                animate={{ scaleY: [h, 1, h] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                style={{ height: 20, originY: 0.5 }}
              />
            ))}
          </div>
        )}

        {/* core icon — hidden when speaking (bars take over) */}
        {!speaking && (
          <div className="absolute inset-10 rounded-full bg-gradient-to-br from-jarvy-accent/30 to-jarvy-accent2/20 flex items-center justify-center shadow-glow">
            {listening
              ? <Mic className="text-jarvy-accent" size={28} />
              : <MicOff className="text-white/60" size={28} />}
          </div>
        )}

        {/* speaking icon overlay */}
        {speaking && (
          <div className="absolute inset-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-400/10 flex items-center justify-center">
          </div>
        )}
      </button>

      <div className="mt-3 text-xs uppercase tracking-widest font-mono"
        style={{ color: speaking ? 'rgb(167,139,250)' : 'rgba(255,255,255,0.5)' }}>
        {label}
      </div>
    </div>
  )
}
