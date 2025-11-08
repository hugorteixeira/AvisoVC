// API utility for backend communication
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Create a new audio session
 * @returns {Promise<{session_id: string}>}
 */
export async function createSession() {
  const response = await fetch(`${API_BASE_URL}/api/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Start calibration for a session
 * @param {string} sessionId
 * @returns {Promise<{status: string}>}
 */
export async function startCalibration(sessionId) {
  const response = await fetch(`${API_BASE_URL}/api/calibration/${sessionId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to start calibration: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Finish calibration for a session
 * @param {string} sessionId
 * @returns {Promise<{baseline: number, duration: number, text: string}>}
 */
export async function finishCalibration(sessionId) {
  const response = await fetch(`${API_BASE_URL}/api/calibration/${sessionId}/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to finish calibration: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get calibration status for a session
 * @param {string} sessionId
 * @returns {Promise<{calibration_baseline: number|null, calibration_duration: number|null, warning_active: boolean}>}
 */
export async function getCalibrationStatus(sessionId) {
  const response = await fetch(`${API_BASE_URL}/api/calibration/${sessionId}/status`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to get calibration status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Dismiss warning for a session
 * @param {string} sessionId
 * @returns {Promise<{status: string}>}
 */
export async function dismissWarning(sessionId) {
  const response = await fetch(`${API_BASE_URL}/api/calibration/${sessionId}/dismiss-warning`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to dismiss warning: ${response.statusText}`);
  }

  return response.json();
}

let sharedAudioContext = null;

async function getAudioContext() {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext is not available in this environment.');
  }
  if (!sharedAudioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('AudioContext API não suportada neste navegador.');
    }
    sharedAudioContext = new AudioContextClass();
  }
  if (sharedAudioContext.state === 'suspended') {
    await sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, s, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

async function blobToPcmPayload(audioBlob) {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = await getAudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  const channelData = audioBuffer.getChannelData(0);
  const pcmBuffer = floatTo16BitPCM(channelData);
  const samplesBase64 = arrayBufferToBase64(pcmBuffer);
  return {
    samples: samplesBase64,
    sampleRate: audioBuffer.sampleRate,
  };
}

/**
 * Send audio chunk to backend for processing
 * @param {string} sessionId
 * @param {Blob} audioBlob
 * @returns {Promise<{warning_active: boolean, transcript: object|null}>}
 */
export async function sendAudioChunk(sessionId, audioBlob) {
  const { samples, sampleRate } = await blobToPcmPayload(audioBlob);

  const response = await fetch(`${API_BASE_URL}/api/audio-chunk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      sample_rate: sampleRate,
      samples,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send audio chunk: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Start listening (for monitoring mode)
 * @param {string} sessionId
 * @returns {Promise<{status: string}>}
 */
export async function startListening(sessionId) {
  const response = await fetch(`${API_BASE_URL}/api/start-listening/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to start listening: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Stop listening (for monitoring mode)
 * @param {string} sessionId
 * @returns {Promise<{status: string}>}
 */
export async function stopListening(sessionId) {
  const response = await fetch(`${API_BASE_URL}/api/stop-listening/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to stop listening: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get session status
 * @param {string} sessionId
 * @returns {Promise<{state: string, transcripts: array}>}
 */
export async function getSessionStatus(sessionId) {
  const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/status`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to get session status: ${response.statusText}`);
  }

  return response.json();
}
