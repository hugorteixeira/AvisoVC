from __future__ import annotations

import argparse
from pathlib import Path

from aviso_vc import Settings, VoiceActivityWorkflow


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Detect speech with pyannote VAD, save 5-second clips, and transcribe with Whisper.",
    )
    parser.add_argument("audio", type=Path, help="Path to the source audio file (wav recommended)")
    parser.add_argument(
        "--segment-duration",
        type=float,
        default=5.0,
        help="Length of each saved speech segment in seconds (default: 5)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("speech_segments"),
        help="Directory where speech clips will be stored",
    )
    parser.add_argument(
        "--whisper-task",
        choices=["translate", "transcribe"],
        default="translate",
        help="Whether Whisper should translate to English or just transcribe",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    settings = Settings(
        audio_path=args.audio,
        segment_duration=args.segment_duration,
        output_dir=args.output_dir,
        whisper_task=args.whisper_task,
    )
    workflow = VoiceActivityWorkflow(settings)
    workflow.run()


if __name__ == "__main__":
    main()
