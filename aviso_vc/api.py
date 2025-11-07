from __future__ import annotations

from pathlib import Path
import sys

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from aviso_vc.config import Settings
    from aviso_vc.service import AudioEngine, SessionTranscript
else:
    from .config import Settings
    from .service import AudioEngine, SessionTranscript


class AudioChunkPayload(BaseModel):
    session_id: str = Field(..., min_length=1)
    sample_rate: int = Field(..., gt=0)
    samples: str = Field(..., description="Base64 encoded int16 PCM data")


class TranscriptModel(BaseModel):
    number: int
    text: str
    words_per_second: float
    chars_per_second: float
    is_below_threshold: bool = False

    @classmethod
    def from_dataclass(cls, transcript: SessionTranscript) -> "TranscriptModel":
        return cls(
            number=transcript.number,
            text=transcript.text,
            words_per_second=transcript.words_per_second,
            chars_per_second=transcript.chars_per_second,
            is_below_threshold=transcript.is_below_threshold,
        )


class ChunkResponse(BaseModel):
    status: str
    transcript: TranscriptModel | None = None
    warning_active: bool = False


class TranscriptsResponse(BaseModel):
    session_id: str
    transcripts: list[TranscriptModel]


def create_app() -> FastAPI:
    settings = Settings()
    engine = AudioEngine(settings)
    app = FastAPI(title="AvisoVC API", version="0.2.0")
    app.state.settings = settings
    app.state.engine = engine

    frontend_dir = Path("frontend")
    static_dir = frontend_dir / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=static_dir), name="static")

    @app.get("/", response_class=HTMLResponse)
    def serve_frontend() -> str:
        index_path = frontend_dir / "index.html"
        if not index_path.exists():
            raise HTTPException(status_code=404, detail="Frontend not built yet")
        return index_path.read_text(encoding="utf-8")

    @app.get("/healthz")
    def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/audio-chunk", response_model=ChunkResponse)
    def ingest_audio(payload: AudioChunkPayload) -> ChunkResponse:
        transcript = app.state.engine.process_chunk(
            session_id=payload.session_id,
            payload_b64=payload.samples,
            sample_rate=payload.sample_rate,
        )

        # Get warning status
        calibration_status = app.state.engine.get_calibration_status(payload.session_id)
        warning_active = calibration_status.get("warning_active", False)

        status = "transcribed" if transcript else calibration_status.get("state", "listening")
        return ChunkResponse(
            status=status,
            transcript=TranscriptModel.from_dataclass(transcript) if transcript else None,
            warning_active=warning_active,
        )

    @app.get("/api/sessions/{session_id}", response_model=TranscriptsResponse)
    def get_transcripts(session_id: str) -> TranscriptsResponse:
        transcripts = app.state.engine.list_transcripts(session_id)
        return TranscriptsResponse(
            session_id=session_id,
            transcripts=[TranscriptModel.from_dataclass(t) for t in transcripts],
        )

    @app.post("/api/calibration/{session_id}/start")
    def start_calibration(session_id: str) -> dict:
        """Start calibration recording for a session."""
        return app.state.engine.start_calibration(session_id)

    @app.post("/api/calibration/{session_id}/finish")
    def finish_calibration(session_id: str) -> dict:
        """Finish calibration and calculate baseline."""
        return app.state.engine.finish_calibration(session_id)

    @app.get("/api/calibration/{session_id}/status")
    def get_calibration_status(session_id: str) -> dict:
        """Get calibration status for a session."""
        return app.state.engine.get_calibration_status(session_id)

    @app.post("/api/calibration/{session_id}/dismiss-warning")
    def dismiss_warning(session_id: str) -> dict:
        """Dismiss the active warning."""
        return app.state.engine.dismiss_warning(session_id)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("aviso_vc.api:app", host="0.0.0.0", port=8000, reload=False)
