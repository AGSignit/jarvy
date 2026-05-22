"""Optional Python voice routes. Gracefully no-op if libs not installed.

Endpoints:
    GET  /voice/status       → is the Python voice stack available?
    POST /voice/speak        → speak text via pyttsx3 on the server
    POST /voice/listen       → listen via microphone, return transcript
"""
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.logger import get_logger

log = get_logger(__name__)
router = APIRouter()

try:
    import pyttsx3  # type: ignore
    _TTS_OK = True
except Exception as e:  # pragma: no cover
    _TTS_OK = False
    log.info("pyttsx3 unavailable: %s", e)

try:
    import speech_recognition as sr  # type: ignore
    _STT_OK = True
except Exception as e:  # pragma: no cover
    _STT_OK = False
    log.info("SpeechRecognition unavailable: %s", e)


class SpeakRequest(BaseModel):
    text: str


@router.get("/voice/status")
async def voice_status() -> dict:
    return {"tts": _TTS_OK, "stt": _STT_OK}


@router.post("/voice/speak")
async def voice_speak(req: SpeakRequest) -> dict:
    if not _TTS_OK:
        return {"ok": False, "error": "pyttsx3 not installed"}
    try:
        engine = pyttsx3.init()
        engine.say(req.text)
        engine.runAndWait()
        return {"ok": True}
    except Exception as e:
        log.exception("TTS failed: %s", e)
        return {"ok": False, "error": str(e)}


@router.post("/voice/listen")
async def voice_listen() -> dict:
    if not _STT_OK:
        return {"ok": False, "error": "SpeechRecognition not installed"}
    try:
        r = sr.Recognizer()
        with sr.Microphone() as source:
            r.adjust_for_ambient_noise(source, duration=0.3)
            audio = r.listen(source, timeout=5, phrase_time_limit=8)
        text = r.recognize_google(audio)
        return {"ok": True, "transcript": text}
    except Exception as e:
        log.exception("STT failed: %s", e)
        return {"ok": False, "error": str(e)}
