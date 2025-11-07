from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Tuple

import numpy as np
import soundfile as sf


@dataclass
class AudioClip:
    path: Path
    start: float
    end: float

    @property
    def duration(self) -> float:
        return max(0.0, self.end - self.start)


def load_audio(path: Path) -> Tuple[np.ndarray, int]:
    """Load audio file as mono waveform."""
    data, sample_rate = sf.read(path)
    return ensure_mono(data), sample_rate


def write_clip(
    audio: np.ndarray,
    sample_rate: int,
    start_time: float,
    duration: float,
    destination: Path,
    prefix: str,
    index: int,
) -> AudioClip | None:
    """Save a slice of the waveform to disk."""
    if duration <= 0:
        return None
    start_sample = max(0, int(start_time * sample_rate))
    end_sample = min(len(audio), start_sample + int(duration * sample_rate))
    if end_sample - start_sample <= 0:
        return None
    destination.mkdir(parents=True, exist_ok=True)
    clip_path = destination / f"{prefix}_{index:04d}.wav"
    sf.write(clip_path, audio[start_sample:end_sample], sample_rate)
    actual_duration = (end_sample - start_sample) / sample_rate
    return AudioClip(path=clip_path, start=start_time, end=start_time + actual_duration)


def ensure_mono(data: np.ndarray) -> np.ndarray:
    if data.ndim == 1:
        return data.astype(np.float32)
    return data.mean(axis=1).astype(np.float32)


def int16_to_float32(samples: bytes) -> np.ndarray:
    if not samples:
        return np.zeros(0, dtype=np.float32)
    int_samples = np.frombuffer(samples, dtype=np.int16)
    return (int_samples.astype(np.float32) / 32768.0).clip(-1.0, 1.0)


def resample_audio(audio: np.ndarray, source_sr: int, target_sr: int) -> np.ndarray:
    if source_sr == target_sr or len(audio) == 0:
        return audio.astype(np.float32)
    duration = len(audio) / float(source_sr)
    target_length = max(1, int(duration * target_sr))
    source_times = np.linspace(0.0, duration, num=len(audio), endpoint=False)
    target_times = np.linspace(0.0, duration, num=target_length, endpoint=False)
    resampled = np.interp(target_times, source_times, audio)
    return resampled.astype(np.float32)
