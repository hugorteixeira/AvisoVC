# Migration to Groq API - Summary

## What Changed

The transcription backend has been migrated from local Whisper (`transformers`) to **Groq API** with `whisper-large-v3-turbo` for significantly better Portuguese transcription quality.

## Benefits

1. **Better Portuguese support**: whisper-large-v3-turbo is much better at Portuguese than whisper-base
2. **Faster transcription**: Groq's inference is much faster than running locally
3. **No GPU required**: Transcription happens on Groq's servers
4. **Lower resource usage**: Your machine doesn't need to load/run Whisper models

## Files Modified

### Core Changes

1. **`aviso_vc/transcription.py`**
   - Replaced `transformers.pipeline` with Groq SDK
   - Audio waveforms are saved to temporary WAV files before sending to Groq
   - Automatic cleanup of temporary files

2. **`aviso_vc/config.py`**
   - Added `groq_model` setting (default: "whisper-large-v3-turbo")
   - Added `groq_api_key` property to read from `GROQ_API_KEY` env var
   - Removed `asr_model_id` (no longer needed)

3. **`aviso_vc/service.py`**
   - Updated `AudioEngine` to pass `groq_api_key` instead of `asr_model_id`

4. **`aviso_vc/orchestrator.py`**
   - Updated `VoiceActivityWorkflow` to use Groq API

5. **`requirements.txt`**
   - Added `groq>=0.11.0`
   - Removed dependency on large transformers models

### Documentation

1. **`README.md`** - Updated with Groq setup instructions
2. **`setup_env.sh`** - New interactive script to set environment variables
3. **`run_backend.py`** - Already existed, no changes needed

## New Requirements

### Environment Variables

You now need **TWO** environment variables:

```bash
export HF_TOKEN="hf_xxx"        # For pyannote VAD models
export GROQ_API_KEY="gsk_xxx"   # For Groq transcription
```

### Getting a Groq API Key

1. Visit https://console.groq.com
2. Create an account (free tier available)
3. Go to https://console.groq.com/keys
4. Create a new API key
5. Export it: `export GROQ_API_KEY="your_key_here"`

## How to Use

### Quick Setup

```bash
# Run the interactive setup script
source setup_env.sh

# Or manually set both variables
export HF_TOKEN="hf_xxx"
export GROQ_API_KEY="gsk_xxx"

# Start the backend
python run_backend.py
```

### Configuration

The Groq model can be changed in `aviso_vc/config.py`:

```python
groq_model: str = "whisper-large-v3-turbo"  # Default
# Other options: "whisper-large-v3", "distil-whisper-large-v3-en"
```

## Backward Compatibility

- The `whisper_task` setting is kept for compatibility but not used (Groq handles this automatically)
- CLI arguments remain the same
- API endpoints unchanged
- Frontend requires no modifications

## Cost Considerations

Groq offers a free tier with generous limits. Check current pricing at https://console.groq.com/settings/billing

For typical usage (5-second audio chunks), costs are minimal or free within the free tier limits.

## Rollback

If you need to rollback to local Whisper:

1. Check out the previous commit before this migration
2. Or manually restore the old `transcription.py` and update the Settings class

However, we recommend sticking with Groq for better Portuguese quality and performance!
