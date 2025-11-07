"""AvisoVC package exposing voice activity detection, transcription and API helpers."""

from . import compat as _compat  # ensure dependency shims load before anything else
from .config import Settings
from .orchestrator import VoiceActivityWorkflow
from .service import AudioEngine
from .api import app as app

__all__ = ["Settings", "VoiceActivityWorkflow", "AudioEngine", "app"]
