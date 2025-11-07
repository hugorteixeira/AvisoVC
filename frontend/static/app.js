const SAMPLE_RATE = 16000;
const CHUNK_SECONDS = 1;
const CHUNK_SAMPLES = SAMPLE_RATE * CHUNK_SECONDS;
const SESSION_ID = (self.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));

const startBtn = document.getElementById("audio-start");
const stopBtn = document.getElementById("audio-stop");
const calibrateStartBtn = document.getElementById("calibrate-start");
const calibrateFinishBtn = document.getElementById("calibrate-finish");
const statusEl = document.getElementById("audio-status");
const transcriptsEl = document.getElementById("transcripts");
const warningBanner = document.getElementById("warning-banner");
const calibrationInfo = document.getElementById("calibration-info");
const calibrationStatus = document.getElementById("calibration-status");
const calibrationTimer = document.getElementById("calibration-timer");

let audioContext;
let processor;
let mediaStream;
let source;
let sampleBuffer = [];
let uploading = false;
let running = false;
let calibrating = false;
let calibrationStartTime = null;
let calibrationTimerInterval = null;

startBtn?.addEventListener("click", startStreaming);
stopBtn?.addEventListener("click", stopStreaming);
calibrateStartBtn?.addEventListener("click", startCalibration);
calibrateFinishBtn?.addEventListener("click", finishCalibration);
warningBanner?.addEventListener("click", dismissWarning);

async function startStreaming() {
  if (running) return;
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    source = audioContext.createMediaStreamSource(mediaStream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = handleAudioProcess;
    source.connect(processor);
    processor.connect(audioContext.destination);
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    updateStatus("Escutando…", "active");
  } catch (err) {
    console.error(err);
    updateStatus("Erro ao acessar microfone", "error");
  }
}

async function stopStreaming() {
  running = false;
  sampleBuffer = [];
  uploading = false;
  if (processor) {
    processor.disconnect();
    processor.onaudioprocess = null;
  }
  if (source) {
    source.disconnect();
  }
  if (audioContext) {
    await audioContext.close();
    audioContext = undefined;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = undefined;
  }
  startBtn.disabled = false;
  stopBtn.disabled = true;
  updateStatus("Parado", "idle");
}

function handleAudioProcess(event) {
  if (!running) return;
  const channelData = event.inputBuffer.getChannelData(0);
  const resampled = downsampleBuffer(channelData, audioContext.sampleRate, SAMPLE_RATE);
  if (!resampled || resampled.length === 0) {
    return;
  }
  for (let i = 0; i < resampled.length; i += 1) {
    sampleBuffer.push(resampled[i]);
  }
  maybeUpload();
}

function maybeUpload() {
  if (uploading) return;
  if (sampleBuffer.length < CHUNK_SAMPLES) return;
  const chunk = sampleBuffer.slice(0, CHUNK_SAMPLES);
  sampleBuffer = sampleBuffer.slice(CHUNK_SAMPLES);
  uploading = true;
  sendChunk(chunk)
    .catch((err) => {
      console.error(err);
      updateStatus("Falha ao enviar áudio", "error");
    })
    .finally(() => {
      uploading = false;
      if (running) {
        maybeUpload();
      }
    });
}

async function sendChunk(floatSamples) {
  const pcm = floatTo16BitPCM(floatSamples);
  const base64 = bytesToBase64(new Uint8Array(pcm.buffer));
  const payload = {
    session_id: SESSION_ID,
    sample_rate: SAMPLE_RATE,
    samples: base64,
  };
  const response = await fetch("/api/audio-chunk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`API respondeu ${response.status}`);
  }
  const data = await response.json();

  // Handle warning
  if (data.warning_active) {
    showWarning();
  }

  if (data.status === "transcribed" && data.transcript) {
    appendTranscript(data.transcript);
    updateStatus("Transcrição pronta", "active");
  } else if (data.status === "calibrating") {
    updateStatus("Calibrando…", "active");
  } else {
    updateStatus("Escutando…", "active");
  }
}

function appendTranscript(transcript) {
  const li = document.createElement("li");
  const meta = document.createElement("span");
  meta.textContent = `Segmento ${transcript.number} · ${transcript.chars_per_second.toFixed(1)} chars/s · ${transcript.words_per_second.toFixed(2)} palavras/s`;
  const text = document.createElement("div");
  text.textContent = transcript.text || "(sem fala detectada)";

  // Highlight if below threshold
  if (transcript.is_below_threshold) {
    li.style.border = "2px solid #dc3545";
    li.style.background = "rgba(220, 53, 69, 0.1)";
  }

  li.appendChild(meta);
  li.appendChild(text);
  transcriptsEl.prepend(li);
  const maxItems = 20;
  while (transcriptsEl.children.length > maxItems) {
    transcriptsEl.removeChild(transcriptsEl.lastChild);
  }
}

function updateStatus(message, variant) {
  statusEl.textContent = message;
  statusEl.classList.remove("idle", "active", "error");
  statusEl.classList.add(variant);
}

function downsampleBuffer(buffer, inSampleRate, outSampleRate) {
  if (outSampleRate === inSampleRate) {
    return buffer.slice(0);
  }
  const sampleRateRatio = inSampleRate / outSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  if (!Number.isFinite(newLength) || newLength <= 0) {
    return null;
  }
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accum += buffer[i];
      count += 1;
    }
    result[offsetResult] = accum / (count || 1);
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function floatTo16BitPCM(floatSamples) {
  const buffer = new Int16Array(floatSamples.length);
  for (let i = 0; i < floatSamples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, floatSamples[i]));
    buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return buffer;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

async function startCalibration() {
  if (calibrating || running) return;
  try {
    // Start microphone if not already running
    if (!audioContext) {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      source = audioContext.createMediaStreamSource(mediaStream);
      processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = handleAudioProcess;
      source.connect(processor);
      processor.connect(audioContext.destination);
    }

    // Call API to start calibration
    const response = await fetch(`/api/calibration/${SESSION_ID}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Falha ao iniciar calibração");
    }

    calibrating = true;
    running = true;
    calibrationStartTime = Date.now();
    sampleBuffer = [];

    // Start timer
    calibrationTimerInterval = setInterval(updateCalibrationTimer, 100);

    calibrateStartBtn.disabled = true;
    calibrateFinishBtn.disabled = false;
    startBtn.disabled = true;
    stopBtn.disabled = true;
    updateStatus("Calibrando… Fale naturalmente!", "active");
    calibrationInfo.classList.add("show");
  } catch (err) {
    console.error(err);
    updateStatus("Erro ao calibrar", "error");
  }
}

async function finishCalibration() {
  if (!calibrating) return;

  const elapsed = (Date.now() - calibrationStartTime) / 1000;

  if (elapsed < 5) {
    alert("Calibração muito curta. Mínimo 5 segundos necessários.");
    return;
  }

  try {
    // Stop timer
    if (calibrationTimerInterval) {
      clearInterval(calibrationTimerInterval);
      calibrationTimerInterval = null;
    }

    // Call API to finish calibration
    const response = await fetch(`/api/calibration/${SESSION_ID}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Falha ao finalizar calibração");
    }

    const data = await response.json();

    if (data.error) {
      alert(data.error);
      calibrating = false;
      running = false;
      calibrateStartBtn.disabled = false;
      calibrateFinishBtn.disabled = true;
      startBtn.disabled = false;
      updateStatus("Erro na calibração", "error");
      calibrationTimer.textContent = "";
      return;
    }

    // Show calibration results
    calibrationStatus.innerHTML = `✓ Calibrado: ${data.baseline_chars_per_second.toFixed(1)} chars/s<br>Duração: ${data.duration.toFixed(1)}s · ${data.character_count} caracteres<br><small>Segmentos agora usarão ${data.duration.toFixed(1)}s de áudio</small>`;
    calibrationTimer.textContent = "";

    // Reset state
    calibrating = false;
    running = false;
    sampleBuffer = [];

    calibrateStartBtn.disabled = false;
    calibrateFinishBtn.disabled = true;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus("Calibração concluída", "active");

    setTimeout(() => {
      updateStatus("Parado", "idle");
    }, 2000);
  } catch (err) {
    console.error(err);
    updateStatus("Erro ao finalizar calibração", "error");
  }
}

function updateCalibrationTimer() {
  if (!calibrating || !calibrationStartTime) return;
  const elapsed = (Date.now() - calibrationStartTime) / 1000;
  const min = Math.floor(elapsed / 60);
  const sec = Math.floor(elapsed % 60);
  const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

  if (elapsed >= 20) {
    calibrationTimer.textContent = `⏱️ ${timeStr} (máximo atingido - finalize agora)`;
    calibrationTimer.style.color = "#dc3545";
  } else if (elapsed >= 5) {
    calibrationTimer.textContent = `⏱️ ${timeStr} (pode finalizar)`;
    calibrationTimer.style.color = "#28a745";
  } else {
    calibrationTimer.textContent = `⏱️ ${timeStr} (mínimo 5s)`;
    calibrationTimer.style.color = "#ffc107";
  }
}

function showWarning() {
  warningBanner.classList.add("active");
}

async function dismissWarning() {
  try {
    const response = await fetch(`/api/calibration/${SESSION_ID}/dismiss-warning`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      warningBanner.classList.remove("active");
    }
  } catch (err) {
    console.error(err);
  }
}

// Load calibration status on page load
window.addEventListener("load", async () => {
  try {
    const response = await fetch(`/api/calibration/${SESSION_ID}/status`);
    if (response.ok) {
      const data = await response.json();
      if (data.calibrated) {
        calibrationStatus.innerHTML = `✓ Calibrado: ${data.baseline.toFixed(1)} chars/s<br><small>Segmentos: ${data.duration.toFixed(1)}s</small>`;
        calibrationInfo.classList.add("show");
      }
      if (data.warning_active) {
        showWarning();
      }
    }
  } catch (err) {
    console.error("Failed to load calibration status:", err);
  }
});

window.addEventListener("beforeunload", () => {
  if (calibrationTimerInterval) {
    clearInterval(calibrationTimerInterval);
  }
  if (running || calibrating) {
    stopStreaming();
  }
});
