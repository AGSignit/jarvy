import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Eraser } from 'lucide-react'
import { api } from '../lib/api'

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-jarvy-accent/20 border border-jarvy-accent/30 text-white'
            : 'bg-white/5 border border-white/10 text-white/90'
        }`}
      >
        {!isUser && msg.tag && msg.tag !== 'chat' && (
          <div className="text-[10px] uppercase tracking-widest text-jarvy-accent/70 mb-1 font-mono">
            {msg.tag}
          </div>
        )}
        {msg.content}
      </div>
    </motion.div>
  )
}

export default function ChatPanel({ pendingTranscript, onResponse, onThinking }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)
  const lastSentTranscript = useRef('')

  // Load history
  useEffect(() => {
    api.history(50).then(({ messages }) => {
      // history is desc; flip
      setMessages([...messages].reverse())
    }).catch(() => {})
  }, [])

  // Auto-submit voice transcript (ref guard prevents StrictMode double-send)
  useEffect(() => {
    if (pendingTranscript && pendingTranscript !== lastSentTranscript.current) {
      lastSentTranscript.current = pendingTranscript
      send(pendingTranscript)
    }
    // eslint-disable-next-line
  }, [pendingTranscript])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function send(text, confirm = false) {
    const trimmed = (text || input).trim()
    if (!trimmed || sending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: trimmed, tag: 'chat' }])
    setSending(true)
    onThinking?.(true)
    try {
      const res = await api.chat(trimmed, confirm)
      setMessages((m) => [...m, { role: 'assistant', content: res.reply, tag: res.source }])
      onResponse?.(res)
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${e.message}`, tag: 'error' }])
    } finally {
      setSending(false)
      onThinking?.(false)
    }
  }

  async function clearAll() {
    if (!confirm('Clear all conversation history?')) return
    await api.clearHistory()
    setMessages([])
  }

  // Detect confirmation-required replies and offer a confirm button
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
  const needsConfirm = lastAssistant?.content?.startsWith('⚠ Confirmation required')

  return (
    <div className="glass rounded-xl flex flex-col h-full relative scanline overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="font-mono text-xs uppercase tracking-widest text-white/60">
          chat ▸ session
        </div>
        <button
          onClick={clearAll}
          className="text-xs text-white/50 hover:text-jarvy-danger flex items-center gap-1"
        >
          <Eraser size={14} /> clear
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
        </AnimatePresence>
        {sending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-jarvy-accent font-mono"
          >
            ▸ thinking...
          </motion.div>
        )}
      </div>

      {needsConfirm && (
        <div className="px-4 py-2 border-t border-jarvy-danger/30 bg-jarvy-danger/10 flex items-center justify-between">
          <span className="text-xs text-jarvy-danger">Unsafe command awaiting confirmation</span>
          <button
            onClick={() => {
              // Re-send the last user message with confirm=true
              const lastUser = [...messages].reverse().find((m) => m.role === 'user')
              if (lastUser) send(lastUser.content, true)
            }}
            className="text-xs px-2 py-1 rounded bg-jarvy-danger/20 hover:bg-jarvy-danger/40 text-white"
          >
            confirm & run
          </button>
        </div>
      )}

      <div className="p-3 border-t border-white/5 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Talk to Jarvy..."
          className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-jarvy-accent/60 font-mono"
        />
        <button
          onClick={() => send()}
          disabled={sending || !input.trim()}
          className="px-3 py-2 rounded-md bg-jarvy-accent/20 border border-jarvy-accent/40 hover:bg-jarvy-accent/30 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
