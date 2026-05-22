// Browser voice: Web Speech API for STT + speechSynthesis for TTS.
import { useCallback, useEffect, useRef, useState } from 'react'

export function useBrowserVoice() {
  const recognitionRef = useRef(null)
  const voicesRef = useRef([])
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(true)
  const [ttsEnabled, setTtsEnabled] = useState(true)

  // Load voices (Chrome loads them async)
  useEffect(() => {
    const loadVoices = () => { voicesRef.current = window.speechSynthesis?.getVoices() || [] }
    loadVoices()
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices)
  }, [])

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
    // Stop any ongoing speech before listening
    window.speechSynthesis?.cancel()
    setSpeaking(false)
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
    if (!window.speechSynthesis || !text || !ttsEnabled) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.05
    u.pitch = 1.0

    // Pick best available English voice (prefer Google voices in Chrome)
    const voices = voicesRef.current
    u.voice =
      voices.find(v => /google.*en.*(us|gb)/i.test(v.name)) ||
      voices.find(v => v.lang.startsWith('en') && !v.localService) ||
      voices.find(v => v.lang.startsWith('en-US')) ||
      voices.find(v => v.lang.startsWith('en')) ||
      null

    u.onstart = () => setSpeaking(true)
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(u)
  }, [ttsEnabled])

  const toggleTts = useCallback(() => {
    setTtsEnabled(prev => {
      if (prev) {
        window.speechSynthesis?.cancel()
        setSpeaking(false)
      }
      return !prev
    })
  }, [])

  return { listening, speaking, transcript, supported, ttsEnabled, start, stop, speak, toggleTts, setTranscript }
}
