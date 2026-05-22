// Browser voice: Web Speech API for STT + speechSynthesis for TTS.
import { useCallback, useEffect, useRef, useState } from 'react'

export function useBrowserVoice() {
  const recognitionRef = useRef(null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const Recog = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recog) {
      setSupported(false)
      return
    }
    const r = new Recog()
    r.continuous = false
    r.interimResults = false
    r.lang = 'en-US'
    r.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript || ''
      setTranscript(text)
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    recognitionRef.current = r
    return () => {
      try { r.abort() } catch {}
    }
  }, [])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    setTranscript('')
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch {}
  }, [])

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop() } catch {}
    setListening(false)
  }, [])

  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !text) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.05
    u.pitch = 1.0
    window.speechSynthesis.speak(u)
  }, [])

  return { listening, transcript, supported, start, stop, speak, setTranscript }
}
