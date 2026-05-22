import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ChatPanel from './components/ChatPanel'
import Sidebar from './components/Sidebar'
import StatusBar from './components/StatusBar'
import VoiceOrb from './components/VoiceOrb'
import { useBrowserVoice } from './hooks/useBrowserVoice'
import { api } from './lib/api'

export default function App() {
  const { listening, transcript, supported, start, stop, speak, setTranscript } = useBrowserVoice()
  const [pendingTranscript, setPendingTranscript] = useState('')
  const [thinking, setThinking] = useState(false)
  const [greeting, setGreeting] = useState('')

  // Personalized greeting on first load
  useEffect(() => {
    api.greet().then(({ reply }) => setGreeting(reply)).catch(() => {})
  }, [])

  // Push completed transcripts into chat
  useEffect(() => {
    if (transcript) {
      setPendingTranscript(transcript)
      setTranscript('')
    }
  }, [transcript, setTranscript])

  function toggleMic() {
    if (!supported) {
      alert('Browser voice not supported. Use Chrome/Edge, or install the Python voice module.')
      return
    }
    listening ? stop() : start()
  }

  function handleResponse(res) {
    if (res?.reply) speak(res.reply)
  }

  return (
    <div className="h-full w-full p-4 lg:p-6 flex flex-col gap-4">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold tracking-wide"
          >
            <span className="text-jarvy-accent">JARVY</span>
            <span className="text-white/40 font-mono text-sm ml-2">v0.01</span>
          </motion.h1>
          {greeting && (
            <div className="text-xs text-white/50 font-mono mt-1">{greeting}</div>
          )}
        </div>
        <StatusBar />
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-4 flex-1 min-h-0">
        {/* Left: sidebar */}
        <div className="hidden lg:block min-h-0">
          <Sidebar />
        </div>

        {/* Center: chat */}
        <div className="min-h-0">
          <ChatPanel
            pendingTranscript={pendingTranscript}
            onResponse={handleResponse}
            onThinking={setThinking}
          />
        </div>

        {/* Right: voice orb + tips */}
        <div className="glass rounded-xl p-6 flex flex-col items-center justify-between min-h-0">
          <div className="text-xs uppercase tracking-widest text-white/50 font-mono self-start">
            voice
          </div>
          <VoiceOrb
            listening={listening}
            thinking={thinking}
            onClick={toggleMic}
            disabled={!supported}
          />
          <div className="w-full text-[11px] font-mono text-white/40 space-y-1">
            <div className="uppercase tracking-widest text-white/50">tips</div>
            <div>• "remember X is Y"</div>
            <div>• "search latest AI news"</div>
            <div>• "run ls -la"</div>
            <div>• "list facts"</div>
            {!supported && (
              <div className="text-jarvy-danger mt-2">
                Browser voice unavailable. Type instead.
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="text-[10px] font-mono text-white/30 text-center">
        jarvy · localhost · {new Date().toLocaleString()}
      </footer>
    </div>
  )
}
