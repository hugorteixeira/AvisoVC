from __future__ import annotations

import io
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np
import soundfile as sf
from groq import Groq

from .audio_utils import AudioClip


def compute_words_per_second(text: str, duration: float) -> float:
    words = text.strip().split()
    if not words or duration <= 0:
        return 0.0
    return len(words) / duration


@dataclass
class TranscriptionResult:
    text: str
    words_per_second: float


class WhisperTranscriber:
    """Transcriber using Groq API with whisper-large-v3 for better Portuguese support."""

    def __init__(self, groq_api_key: str, model: str = "whisper-large-v3") -> None:
        """
        Initialize Groq-based transcriber.

        Args:
            groq_api_key: Groq API key for authentication
            model: Groq model to use (default: whisper-large-v3)
        """
        self.client = Groq(api_key=groq_api_key)
        self.model = model

    def transcribe(self, clip: AudioClip) -> TranscriptionResult:
        """Transcribe audio from a file path."""
        with open(clip.path, "rb") as file:
            transcription = self.client.audio.transcriptions.create(
                file=(clip.path.name, file.read()),
                model=self.model,
                temperature=0.0,
                response_format="verbose_json",
            )
        text = transcription.text.strip()
        wps = compute_words_per_second(text, clip.duration)
        return TranscriptionResult(text=text, words_per_second=wps)

    def transcribe_waveform(self, waveform: np.ndarray, sample_rate: int) -> TranscriptionResult:
        """Transcribe audio from a numpy waveform array."""
        # Ensure mono audio
        if waveform.ndim > 1:
            waveform = waveform.mean(axis=0)
        waveform = np.asarray(waveform, dtype=np.float32)
        duration = len(waveform) / float(sample_rate or 1)

        # Create a temporary WAV file for Groq API
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
            tmp_path = tmp_file.name
            # Write audio data to temporary WAV file
            sf.write(tmp_path, waveform, sample_rate)

        try:
            # Transcribe using Groq API
            with open(tmp_path, "rb") as file:
                transcription = self.client.audio.transcriptions.create(
                    file=(Path(tmp_path).name, file.read()),
                    model=self.model,
                    temperature=0.0,
                    response_format="verbose_json",
                )
            text = transcription.text.strip()
            wps = compute_words_per_second(text, duration)
            return TranscriptionResult(text=text, words_per_second=wps)
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
