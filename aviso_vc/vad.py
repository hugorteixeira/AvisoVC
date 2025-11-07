from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import List
import inspect

import numpy as np
import torch
from pyannote.audio import Pipeline


@dataclass
class SpeechSegment:
    start: float
    end: float


class VoiceActivityDetector:
    def __init__(self, model_id: str, hf_token: str) -> None:
        self.pipeline = Pipeline.from_pretrained(
            model_id, **self._auth_kwargs(hf_token)
        )
        self._lock = Lock()

    def detect(self, audio_path: Path) -> List[SpeechSegment]:
        with self._lock:
            result = self.pipeline(str(audio_path))
        timeline = result.get_timeline().support()
        return [SpeechSegment(start=float(segment.start), end=float(segment.end)) for segment in timeline]

    @staticmethod
    def _auth_kwargs(token: str) -> dict:
        sig = inspect.signature(Pipeline.from_pretrained)
        if "token" in sig.parameters:
            return {"token": token}
        return {"use_auth_token": token}

    def detect_waveform(self, waveform: np.ndarray, sample_rate: int) -> List[SpeechSegment]:
        if len(waveform) == 0:
            return []
        tensor = torch.from_numpy(waveform.astype(np.float32)).unsqueeze(0)
        with self._lock:
            result = self.pipeline({"waveform": tensor, "sample_rate": sample_rate})
        timeline = result.get_timeline().support()
        return [SpeechSegment(start=float(segment.start), end=float(segment.end)) for segment in timeline]
