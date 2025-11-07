import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const { FaceLandmarker, FilesetResolver } = vision;

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start");
const statusEl = document.getElementById("status");
const scoreEl = document.getElementById("score");

const IDX = { MOUTH_L: 61, MOUTH_R: 291, EYE_L_OUT: 33, EYE_R_OUT: 263 };

let landmarker;
let persist = 0;
let alerted = false;
const baseline = [];
const recent = [];

const BASE_N = 60;
const RECENT_N = 10;
const PERSIST_FRAMES = 8;

function push(arr, x, max) {
  arr.push(x);
  if (arr.length > max) arr.shift();
}
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
const std = (arr, mu) => Math.sqrt(arr.reduce((a, b) => a + (b - mu) * (b - mu), 0) / (arr.length || 1));

function vec(a, b) {
  return { x: b.x - a.x, y: b.y - a.y };
}
function len(v) {
  return Math.hypot(v.x, v.y) || 1;
}
function toPx(p) {
  return { x: p.x * canvas.width, y: p.y * canvas.height };
}

async function initCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: 720, height: 540 },
    audio: false,
  });
  video.srcObject = stream;
  await new Promise((resolve) => {
    video.onloadedmetadata = resolve;
  });
  await video.play();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

async function initLandmarker() {
  const fileset = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  landmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });
}

function drawGuide(a, b, color, width = 2) {
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function step() {
  const now = performance.now();
  const res = landmarker.detectForVideo(video, now);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (!res || !res.faceLandmarks || !res.faceLandmarks.length) {
    statusEl.textContent = "Sem rosto";
    statusEl.classList.remove("active", "error");
    statusEl.classList.add("idle");
    requestAnimationFrame(step);
    return;
  }

  const lm = res.faceLandmarks[0].map(toPx);
  const eyeL = lm[IDX.EYE_L_OUT];
  const eyeR = lm[IDX.EYE_R_OUT];
  const mouthL = lm[IDX.MOUTH_L];
  const mouthR = lm[IDX.MOUTH_R];

  const eyeVec = vec(eyeR, eyeL);
  const eyeAngle = Math.atan2(eyeVec.y, eyeVec.x);
  const eyeDist = len(eyeVec);

  const mouthVec = vec(mouthL, mouthR);
  const c = Math.cos(-eyeAngle);
  const s = Math.sin(-eyeAngle);
  const mouthVyAligned = mouthVec.x * s + mouthVec.y * c;

  const skew = mouthVyAligned / eyeDist;

  if (baseline.length < BASE_N) {
    push(baseline, skew, BASE_N);
    statusEl.textContent = "Calibrando…";
    statusEl.classList.add("idle");
  } else {
    push(recent, skew, RECENT_N);
    const mu = mean(baseline);
    const sigma = std(baseline, mu);
    const muRecent = mean(recent);
    const delta = Math.abs(muRecent - mu);
    const threshold = Math.max(0.07, 3 * sigma);

    if (recent.length === RECENT_N && delta > threshold) {
      persist += 1;
    } else {
      persist = Math.max(0, persist - 1);
    }
    if (persist >= PERSIST_FRAMES) alerted = true;

    statusEl.textContent = alerted ? "ALERTA" : "OK";
    statusEl.classList.remove("idle", "error", "active");
    statusEl.classList.add(alerted ? "error" : "active");
    scoreEl.textContent = `Índice: ${muRecent.toFixed(3)} (base ${mu.toFixed(3)})`;

    if (!alerted && recent.length === RECENT_N && delta < threshold / 2) {
      push(baseline, muRecent, BASE_N);
    }
  }

  drawGuide(eyeL, eyeR, "rgba(160,160,160,.7)", 2);
  drawGuide(mouthL, mouthR, alerted ? "rgba(255,70,70,.9)" : "rgba(60,220,120,.9)", 3);

  requestAnimationFrame(step);
}

startBtn?.addEventListener("click", async () => {
  startBtn.disabled = true;
  try {
    await initCamera();
    await initLandmarker();
    alerted = false;
    persist = 0;
    baseline.length = 0;
    recent.length = 0;
    statusEl.textContent = "Calibrando…";
    statusEl.classList.add("idle");
    scoreEl.textContent = "Índice: —";
    step();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Erro";
    statusEl.classList.remove("idle", "active");
    statusEl.classList.add("error");
  }
});
