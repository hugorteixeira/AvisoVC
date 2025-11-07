from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

from .audio_utils import AudioClip, load_audio, write_clip
from .config import Settings
from .transcription import TranscriptionResult, WhisperTranscriber
from .vad import SpeechSegment, VoiceActivityDetector


@dataclass
class ProcessedSegment:
    clip: AudioClip
    transcription: TranscriptionResult


class VoiceActivityWorkflow:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        if self.settings.audio_path is None:
            raise ValueError("Settings.audio_path must be set when using VoiceActivityWorkflow")
        self.detector = VoiceActivityDetector(settings.vad_model_id, settings.hf_token)
        self.transcriber = WhisperTranscriber(settings.groq_api_key, model=settings.groq_model)

    def run(self) -> List[ProcessedSegment]:
        self.settings.ensure_output_dir()
        audio, sample_rate = load_audio(self.settings.audio_path)
        audio_duration = len(audio) / sample_rate
        segments = self.detector.detect(self.settings.audio_path)
        results: List[ProcessedSegment] = []

        if not segments:
            print("No speech activity detected.")
            return results

        for idx, segment in enumerate(segments, start=1):
            clip = self._save_clip(segment, audio, sample_rate, audio_duration, idx)
            if not clip:
                continue
            transcription = self.transcriber.transcribe(clip)
            results.append(ProcessedSegment(clip=clip, transcription=transcription))
            self._display_result(idx, results[-1])
        return results

    def _save_clip(
        self,
        segment: SpeechSegment,
        audio,
        sample_rate: int,
        audio_duration: float,
        idx: int,
    ) -> AudioClip | None:
        start_time = max(0.0, float(segment.start))
        end_time = min(audio_duration, start_time + self.settings.segment_duration)
        duration = end_time - start_time
        return write_clip(
            audio=audio,
            sample_rate=sample_rate,
            start_time=start_time,
            duration=duration,
            destination=self.settings.output_dir,
            prefix="segment",
            index=idx,
        )

    @staticmethod
    def _display_result(idx: int, processed: ProcessedSegment) -> None:
        clip = processed.clip
        transcription = processed.transcription
        print(
            f"[segment {idx}] {clip.start:.2f}s - {clip.end:.2f}s | "
            f"words/sec: {transcription.words_per_second:.2f}"
        )
        print(f"  Transcript: {transcription.text}\n")
