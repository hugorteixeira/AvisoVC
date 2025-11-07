# Calibration Feature Documentation

## Overview

The calibration feature establishes a baseline speech rate for each user session. It monitors subsequent transcriptions and raises a visual warning if the speech rate drops below 50% of the baseline, which may indicate a medical emergency like a stroke.

## How It Works

### 1. Calibration Process

**User Flow:**
1. Click the **"Calibrar"** button to start calibration
2. Speak naturally for 5-20 seconds (a timer shows progress)
3. Click **"Finalizar calibração"** when done
4. System transcribes the audio and calculates characters per second (baseline)

**⚠️ IMPORTANT:** The duration you choose for calibration becomes the segment duration for all future recordings.

**Example:**
- If you calibrate for 8 seconds → all future segments will be 8 seconds
- If you calibrate for 15 seconds → all future segments will be 15 seconds

This ensures apples-to-apples comparison (same duration = fair comparison).

**Technical Process:**
- Audio is captured continuously during calibration
- Minimum duration: 5 seconds
- Maximum duration: 20 seconds (auto-trimmed if exceeded)
- The full audio is transcribed using Groq API
- Baseline = `total_characters / duration_seconds`
- `calibration_duration` is stored and used for all future segments

### 2. Monitoring Phase

After calibration, every transcription is analyzed using the **same duration** as calibration:

**Segment Duration:**
```python
# If calibrated for 8 seconds, segments will be 8 seconds
target_duration = calibration_duration if calibrated else 5.0  # default
```

**For Each Transcription:**
```python
# Both calibration and monitoring use the SAME duration
chars_per_second = len(transcription_text) / calibration_duration
threshold = baseline * 0.5  # 50% of baseline

if chars_per_second < threshold:
    trigger_warning()
```

**Why This Matters:**
- Comparing 8s to 8s is fair
- Comparing 8s to 5s would be misleading
- Duration affects how much speech is captured

**Warning Behavior:**
- A red banner appears at the top of the screen
- Banner pulses to grab attention
- Transcriptions below threshold are highlighted in red
- Warning persists across transcriptions until dismissed

### 3. Warning Dismissal

- User clicks the warning banner to dismiss it
- Dismissal is per-session (cleared on page refresh)
- Can be triggered again by subsequent low-rate transcriptions

## API Endpoints

### Start Calibration
```http
POST /api/calibration/{session_id}/start
```
**Response:**
```json
{
  "status": "calibrating"
}
```

### Finish Calibration
```http
POST /api/calibration/{session_id}/finish
```
**Response (Success):**
```json
{
  "success": true,
  "baseline_chars_per_second": 42.5,
  "duration": 10.2,
  "transcription": "Sample text...",
  "character_count": 434
}
```

**Response (Error):**
```json
{
  "error": "Calibration too short. Minimum 5 seconds required."
}
```

### Get Calibration Status
```http
GET /api/calibration/{session_id}/status
```
**Response:**
```json
{
  "calibrated": true,
  "baseline": 42.5,
  "duration": 10.2,
  "warning_active": false,
  "state": "listening"
}
```

### Dismiss Warning
```http
POST /api/calibration/{session_id}/dismiss-warning
```
**Response:**
```json
{
  "status": "dismissed"
}
```

## Frontend Components

### UI Elements

1. **Calibration Buttons**
   - `#calibrate-start` - Starts calibration
   - `#calibrate-finish` - Ends calibration (enabled only during calibration)

2. **Calibration Info Panel**
   - Shows calibration status
   - Displays baseline when calibrated
   - Shows real-time timer during calibration

3. **Warning Banner**
   - Fixed at top of viewport
   - Red background with pulsing animation
   - Click to dismiss
   - `z-index: 9999` to ensure visibility

### Visual Indicators

**Timer Colors:**
- Yellow (0-5s): "Mínimo 5s"
- Green (5-20s): "Pode finalizar"
- Red (>20s): "Máximo atingido - finalize agora"

**Transcription Highlighting:**
- Normal: Default styling
- Below threshold: Red border + light red background

## Backend Architecture

### Session State Management

Each `AudioSession` tracks:
```python
calibration_baseline: Optional[float] = None  # chars/sec baseline
calibration_duration: Optional[float] = None  # duration in seconds (used for segments)
warning_active: bool = False
```

**Key Insight:** `calibration_duration` serves two purposes:
1. Stores how long the calibration took
2. **Sets the segment duration** for all future recordings in this session

### State Machine

```
LISTENING → CALIBRATING → LISTENING
     ↓
RECORDING → LISTENING
```

**During CALIBRATING:**
- All audio chunks are buffered
- No VAD or transcription
- Chunks continue accumulating until finish

**After Calibration:**
- Returns to normal LISTENING → RECORDING flow
- Each transcription checked against baseline

### Data Flow

```
1. User clicks "Calibrar"
   → Frontend calls /api/calibration/{id}/start
   → Backend sets state = CALIBRATING

2. Audio chunks sent via /api/audio-chunk
   → Buffered (not transcribed)
   → Status = "calibrating"

3. User clicks "Finalizar calibração"
   → Frontend calls /api/calibration/{id}/finish
   → Backend transcribes buffer
   → Calculates baseline
   → Returns to LISTENING

4. Normal recording continues
   → Each transcription calculates chars/sec
   → Compared to baseline
   → Warning flag set if < 50%
```

## Configuration

### Thresholds

Current implementation:
- **Minimum calibration duration:** 5 seconds
- **Maximum calibration duration:** 20 seconds
- **Warning threshold:** 50% of baseline

To adjust, modify `aviso_vc/service.py`:
```python
# Line ~91: Change warning threshold
threshold = self.calibration_baseline * 0.5  # Change 0.5 to desired %

# Lines ~126-135: Change duration limits
if duration < 5.0:  # Minimum
if duration > 20.0:  # Maximum
```

### Per-Session vs Global

Currently: **Per-session** (resets on page refresh)

To make global (persistent):
1. Store `calibration_baseline` in database
2. Load on session creation
3. Add reset endpoint for user to recalibrate

## Testing

### Manual Test

1. **Start backend:** `python run_backend.py`
2. **Open browser:** http://localhost:8000
3. **Calibrate:**
   - Click "Calibrar"
   - Speak naturally for 10 seconds
   - Click "Finalizar calibração"
   - Note the baseline (e.g., "42.5 chars/s")
4. **Test warning:**
   - Click "Iniciar microfone"
   - Speak very slowly (or whisper)
   - Warning should appear if < 50% baseline
5. **Dismiss warning:**
   - Click the red banner
   - Should disappear

### Automated Test

```python
# Test calibration calculation
def test_calibration():
    session = AudioSession(...)
    session.start_calibration()

    # Simulate 10s of audio
    result = session.finish_calibration()

    assert result["success"] == True
    assert result["duration"] >= 5.0
    assert result["baseline_chars_per_second"] > 0
```

## Medical Context

### Why Characters Per Second?

- More granular than words per second
- Less affected by transcription errors
- Captures subtle speech slowdown

### 50% Threshold Rationale

- Significant slowdown indicator
- Reduces false positives from normal variation
- Based on stroke speech pattern research

### Limitations

⚠️ **This is NOT medical diagnostic software**
- For awareness/monitoring only
- Should not replace professional medical evaluation
- False positives/negatives possible
- Background noise affects accuracy

## Future Enhancements

1. **Adjustable threshold** - User configurable (30-70%)
2. **Multiple baselines** - Different baselines for different contexts
3. **Persistence** - Save baseline across sessions
4. **Analytics** - Track speech rate trends over time
5. **Audio quality check** - Warn if calibration audio quality is poor
6. **Multi-language** - Language-specific baseline adjustments
