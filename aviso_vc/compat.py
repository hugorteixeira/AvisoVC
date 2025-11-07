"""Runtime compatibility helpers for optional dependencies."""

from __future__ import annotations

import warnings

try:
    import numpy as _np
except Exception:  # pragma: no cover
    _np = None
else:
    if not hasattr(_np, "NaN") and hasattr(_np, "nan"):
        _np.NaN = _np.nan  # type: ignore[attr-defined]

try:
    import torchaudio  # type: ignore
except Exception:  # pragma: no cover - torchaudio may not even be installed
    torchaudio = None
else:
    def _warn_backend(message: str) -> None:
        warnings.warn(message, RuntimeWarning)

    if not hasattr(torchaudio, "set_audio_backend"):
        def _set_audio_backend(name: str) -> None:
            if name != "soundfile":
                raise RuntimeError(
                    "This environment only supports the 'soundfile' backend."
                )
            _warn_backend(
                "torchaudio.set_audio_backend is missing; forcing soundfile backend."
            )

        torchaudio.set_audio_backend = _set_audio_backend  # type: ignore[attr-defined]

    if not hasattr(torchaudio, "get_audio_backend"):
        def _get_audio_backend() -> str:
            _warn_backend(
                "torchaudio.get_audio_backend is missing; assuming soundfile backend."
            )
            return "soundfile"

        torchaudio.get_audio_backend = _get_audio_backend  # type: ignore[attr-defined]
