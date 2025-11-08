from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path
from typing import Optional


@dataclass
class Settings:
    """Application configuration."""

    audio_path: Optional[Path] = None
    segment_duration: float = 5.0
    output_dir: Path = Path("speech_segments")
    vad_model_id: str = "pyannote/voice-activity-detection"
    groq_model: str = "whisper-large-v3"
    hf_token_env_var: str = "HF_TOKEN"
    groq_api_key_env_var: str = "GROQ_API_KEY"
    whisper_task: str = "translate"  # Kept for backward compatibility, not used with Groq
    stream_sample_rate: int = 16000

    def __post_init__(self) -> None:
        if self.audio_path is not None:
            self.audio_path = Path(self.audio_path)
        self.output_dir = Path(self.output_dir)
        if self.segment_duration <= 0:
            raise ValueError("segment_duration must be positive")
        if self.whisper_task not in {"translate", "transcribe"}:
            raise ValueError("whisper_task must be 'translate' or 'transcribe'")
        if self.stream_sample_rate <= 0:
            raise ValueError("stream_sample_rate must be positive")

    @property
    def hf_token(self) -> str:
        token = os.getenv(self.hf_token_env_var)
        if not token:
            raise RuntimeError(
                f"Environment variable '{self.hf_token_env_var}' must contain a Hugging Face token."
            )
        return token

    @property
    def groq_api_key(self) -> str:
        api_key = os.getenv(self.groq_api_key_env_var)
        if not api_key:
            raise RuntimeError(
                f"Environment variable '{self.groq_api_key_env_var}' must contain a Groq API key."
            )
        return api_key

    def ensure_output_dir(self) -> None:
        self.output_dir.mkdir(parents=True, exist_ok=True)
