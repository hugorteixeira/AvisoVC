from __future__ import annotations

import base64
from dataclasses import dataclass, field
from enum import Enum
from threading import Lock
from typing import Dict, List, Optional

import numpy as np

from .audio_utils import int16_to_float32, resample_audio
from .config import Settings
from .transcription import WhisperTranscriber
from .vad import VoiceActivityDetector


class SessionState(str, Enum):
    LISTENING = "listening"
    RECORDING = "recording"
    CALIBRATING = "calibrating"


@dataclass
class SessionTranscript:
    number: int
    text: str
    words_per_second: float
    chars_per_second: float
    is_below_threshold: bool = False


@dataclass
class AudioSession:
    session_id: str
    settings: Settings
    detector: VoiceActivityDetector
    transcriber: WhisperTranscriber
    state: SessionState = SessionState.LISTENING
    buffer: np.ndarray = field(default_factory=lambda: np.zeros(0, dtype=np.float32))
    transcripts: List[SessionTranscript] = field(default_factory=list)
    calibration_baseline: Optional[float] = None  # chars per second baseline
    calibration_duration: Optional[float] = None  # duration of calibration recording
    warning_active: bool = False  # True when below threshold warning is active
    _lock: Lock = field(default_factory=Lock, repr=False, compare=False)
    _completed: int = 0

    def ingest_bytes(self, payload: bytes, sample_rate: int) -> Optional[SessionTranscript]:
        waveform = int16_to_float32(payload)
        return self.ingest_waveform(waveform, sample_rate)

    def ingest_base64(self, payload: str, sample_rate: int) -> Optional[SessionTranscript]:
        data = base64.b64decode(payload)
        return self.ingest_bytes(data, sample_rate)

    def ingest_waveform(self, waveform: np.ndarray, sample_rate: int) -> Optional[SessionTranscript]:
        with self._lock:
            chunk = resample_audio(waveform, sample_rate, self.settings.stream_sample_rate)
            if len(chunk) == 0:
                return None

            # Handle calibration mode
            if self.state == SessionState.CALIBRATING:
                self.buffer = np.concatenate((self.buffer, chunk))
                return None

            # Normal listening/recording flow
            if self.state == SessionState.LISTENING:
                segments = self.detector.detect_waveform(chunk, self.settings.stream_sample_rate)
                if segments:
                    self.state = SessionState.RECORDING
                    self.buffer = chunk.copy()
                return None

            if self.state == SessionState.RECORDING:
                self.buffer = np.concatenate((self.buffer, chunk))

                # Use calibration duration if available, otherwise use default segment duration
                target_duration = self.calibration_duration if self.calibration_duration else self.settings.segment_duration
                target_samples = int(target_duration * self.settings.stream_sample_rate)

                if len(self.buffer) >= target_samples:
                    audio = self.buffer[:target_samples]
                    self.buffer = np.zeros(0, dtype=np.float32)
                    self.state = SessionState.LISTENING
                    result = self.transcriber.transcribe_waveform(
                        audio, self.settings.stream_sample_rate
                    )

                    # Calculate chars per second
                    duration = len(audio) / self.settings.stream_sample_rate
                    chars_per_second = len(result.text) / duration if duration > 0 else 0.0

                    # Check if below threshold (50% of calibration baseline)
                    is_below_threshold = False
                    if self.calibration_baseline is not None and self.calibration_baseline > 0:
                        threshold = self.calibration_baseline * 0.5
                        if chars_per_second < threshold:
                            is_below_threshold = True
                            self.warning_active = True

                    self._completed += 1
                    transcript = SessionTranscript(
                        number=self._completed,
                        text=result.text,
                        words_per_second=result.words_per_second,
                        chars_per_second=chars_per_second,
                        is_below_threshold=is_below_threshold,
                    )
                    self.transcripts.append(transcript)
                    return transcript
            return None

    def start_calibration(self) -> None:
        """Start calibration recording."""
        with self._lock:
            self.state = SessionState.CALIBRATING
            self.buffer = np.zeros(0, dtype=np.float32)
            self.calibration_baseline = None
            self.calibration_duration = None

    def finish_calibration(self) -> dict:
        """Finish calibration and calculate baseline."""
        with self._lock:
            if self.state != SessionState.CALIBRATING:
                return {"error": "Not in calibration mode"}

            duration = len(self.buffer) / self.settings.stream_sample_rate

            # Validate duration (5-20 seconds)
            if duration < 5.0:
                self.state = SessionState.LISTENING
                self.buffer = np.zeros(0, dtype=np.float32)
                return {"error": "Calibration too short. Minimum 5 seconds required."}

            if duration > 20.0:
                # Trim to 20 seconds
                max_samples = int(20.0 * self.settings.stream_sample_rate)
                self.buffer = self.buffer[:max_samples]
                duration = 20.0

            # Transcribe the calibration audio
            result = self.transcriber.transcribe_waveform(
                self.buffer, self.settings.stream_sample_rate
            )

            # Calculate baseline chars per second
            chars_per_second = len(result.text) / duration if duration > 0 else 0.0

            self.calibration_baseline = chars_per_second
            self.calibration_duration = duration
            self.state = SessionState.LISTENING
            self.buffer = np.zeros(0, dtype=np.float32)

            return {
                "success": True,
                "baseline_chars_per_second": chars_per_second,
                "duration": duration,
                "transcription": result.text,
                "character_count": len(result.text),
            }

    def dismiss_warning(self) -> None:
        """Dismiss the active warning."""
        with self._lock:
            self.warning_active = False


class AudioEngine:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.detector = VoiceActivityDetector(settings.vad_model_id, settings.hf_token)
        self.transcriber = WhisperTranscriber(settings.groq_api_key, model=settings.groq_model)
        self.sessions: Dict[str, AudioSession] = {}
        self._lock = Lock()

    def _get_session(self, session_id: str) -> AudioSession:
        with self._lock:
            session = self.sessions.get(session_id)
            if session is None:
                session = AudioSession(
                    session_id=session_id,
                    settings=self.settings,
                    detector=self.detector,
                    transcriber=self.transcriber,
                )
                self.sessions[session_id] = session
            return session

    def process_chunk(self, session_id: str, payload_b64: str, sample_rate: int) -> Optional[SessionTranscript]:
        session = self._get_session(session_id)
        return session.ingest_base64(payload_b64, sample_rate)

    def list_transcripts(self, session_id: str) -> List[SessionTranscript]:
        session = self.sessions.get(session_id)
        if not session:
            return []
        return list(session.transcripts)

    def start_calibration(self, session_id: str) -> dict:
        """Start calibration for a session."""
        session = self._get_session(session_id)
        session.start_calibration()
        return {"status": "calibrating"}

    def finish_calibration(self, session_id: str) -> dict:
        """Finish calibration for a session."""
        session = self._get_session(session_id)
        return session.finish_calibration()

    def get_calibration_status(self, session_id: str) -> dict:
        """Get calibration status for a session."""
        session = self.sessions.get(session_id)
        if not session:
            return {
                "calibrated": False,
                "baseline": None,
                "warning_active": False,
                "state": "listening",
            }
        return {
            "calibrated": session.calibration_baseline is not None,
            "baseline": session.calibration_baseline,
            "duration": session.calibration_duration,
            "warning_active": session.warning_active,
            "state": session.state.value,
        }

    def dismiss_warning(self, session_id: str) -> dict:
        """Dismiss warning for a session."""
        session = self.sessions.get(session_id)
        if not session:
            return {"status": "session_not_found"}
        session.dismiss_warning()
        return {"status": "dismissed"}
