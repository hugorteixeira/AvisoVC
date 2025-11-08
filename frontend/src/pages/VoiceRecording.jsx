import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { AudioRecorder, visualizeAudioLevel } from '../utils/audioRecorder';
import { createSession, startCalibration, finishCalibration, sendAudioChunk } from '../utils/api';

export default function VoiceRecording() {
  const navigate = useNavigate();
  const { setBaselineVoice } = useApp();

  const [status, setStatus] = useState('init'); // init, ready, recording, processing, complete, error
  const [sessionId, setSessionId] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [calibrationResult, setCalibrationResult] = useState(null);
  const [error, setError] = useState(null);

  const audioRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioLevelIntervalRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
    };
  }, []);

  const initializeSession = async () => {
    try {
      // Create session
      const session = await createSession();
      setSessionId(session.session_id);

      // Initialize audio recorder
      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.init();

      setStatus('ready');
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  const handleStartRecording = async () => {
    if (!sessionId || !audioRecorderRef.current) {
      setError('Sistema não inicializado');
      return;
    }

    try {
      // Start calibration on backend
      await startCalibration(sessionId);

      // Start recording (chunks will be sent when stopping)
      audioRecorderRef.current.startRecording();
      setStatus('recording');
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 0.1;
          // Auto-stop at 20 seconds (maximum)
          if (newTime >= 20) {
            handleStopRecording();
          }
          return newTime;
        });
      }, 100);

      // Start audio level monitoring
      audioLevelIntervalRef.current = audioRecorderRef.current.startAudioLevelMonitoring(
        (level) => setAudioLevel(level),
        100
      );
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  const handleStopRecording = async () => {
    if (!audioRecorderRef.current || !sessionId) return;

    // Clear timer and audio level monitoring
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    // Check minimum duration
    if (recordingTime < 5) {
      setError('Gravação muito curta! Mínimo 5 segundos.');
      setStatus('ready');
      setRecordingTime(0);
      return;
    }

    setStatus('processing');

    try {
      // Stop recording and send captured audio to backend
      const audioBlob = await audioRecorderRef.current.stopRecording();
      await sendAudioChunk(sessionId, audioBlob);

      // Finish calibration on backend
      const result = await finishCalibration(sessionId);

      const derivedDuration = result?.duration ?? recordingTime;
      const derivedBaseline =
        typeof result?.baseline === 'number' && Number.isFinite(result.baseline)
          ? result.baseline
          : (result?.text?.length || 0) / (derivedDuration || 1);

      const normalizedResult = {
        ...result,
        duration: derivedDuration,
        baseline: derivedBaseline,
      };

      setCalibrationResult(normalizedResult);

      // Save to context
      setBaselineVoice({
        baseline: derivedBaseline,
        duration: derivedDuration,
        text: result?.text ?? '',
        sessionId: sessionId,
      });

      setStatus('complete');
    } catch (err) {
      console.error('Failed to process calibration:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  const handleContinue = () => {
    cleanup();
    navigate('/face-recording');
  };

  const handleRetry = () => {
    setStatus('ready');
    setRecordingTime(0);
    setAudioLevel(0);
    setCalibrationResult(null);
    setError(null);
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cleanup();
    }
  };

  const renderRecordingPanel = () => (
    <div className="card bg-recording mt-3">
      {status === 'recording' ? (
        <>
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            GRAVANDO
          </div>

          <div className="timer">
            {recordingTime.toFixed(1)}s
          </div>

          <div className="audio-visualizer">
            <div className="audio-bars">
              {visualizeAudioLevel(audioLevel)}
            </div>
            <p className="text-muted mt-2">Nível: {audioLevel.toFixed(0)}%</p>
          </div>

          <div className="mt-3">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (recordingTime / 20) * 100)}%` }}
              ></div>
            </div>
            <p className="text-muted mt-1">
              {recordingTime < 5
                ? `Mínimo: 5s (faltam ${(5 - recordingTime).toFixed(1)}s)`
                : `Máximo: 20s (faltam ${(20 - recordingTime).toFixed(1)}s)`
              }
            </p>
          </div>
        </>
      ) : (
        <div className="text-center">
          <div className="icon" style={{ fontSize: '3rem', marginBottom: '12px' }}>🎙️</div>
          <p className="mb-1" style={{ fontWeight: 600 }}>Pronto para gravar</p>
          <p className="text-muted mb-0">Clique em "Iniciar gravação" para começar.</p>
        </div>
      )}
    </div>
  );

  // Render different states
  if (status === 'init') {
    return (
      <div className="container">
        <div className="spinner"></div>
        <p>Inicializando sistema de áudio...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container">
        <div className="icon danger">⚠️</div>
        <h1>Erro</h1>
        <p className="text-danger">{error}</p>
        <button className="button" onClick={initializeSession}>
          TENTAR NOVAMENTE
        </button>
      </div>
    );
  }

  if (status === 'complete' && calibrationResult) {
    const calibrationDuration = calibrationResult.duration ?? recordingTime;
    const calibrationBaseline = calibrationResult.baseline ?? 0;
    return (
      <div className="container">
        <div className="icon success">✓</div>
        <h1>Calibração Completa!</h1>

        <div className="card mt-3">
          <h3>Resultados da Calibração</h3>
          <div className="mt-2">
            <p><strong>Duração:</strong> {calibrationDuration.toFixed(1)}s</p>
            <p><strong>Velocidade de Fala:</strong> {calibrationBaseline.toFixed(2)} caracteres/segundo</p>
            {calibrationResult.text && (
              <p className="text-muted mt-2"><em>"{calibrationResult.text}"</em></p>
            )}
          </div>
        </div>

        <div className="card mt-2 bg-info">
          <p className="mb-0">
            <strong>ℹ️ Importante:</strong> Seu padrão de fala foi salvo. O sistema irá alertá-lo
            se detectar uma queda significativa na sua velocidade de fala.
          </p>
        </div>

        <button className="button green mt-3" onClick={handleContinue}>
          CONTINUAR PARA DETECÇÃO FACIAL
        </button>
        <button className="button white mt-2" onClick={handleRetry}>
          REFAZER CALIBRAÇÃO
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="progress-indicator">
        <div className="step active">1</div>
        <div className="step-line"></div>
        <div className="step">2</div>
      </div>

      <h1>Calibração de Voz</h1>
      <p className="text-muted">Etapa 1 de 2 - Criação do Perfil</p>

      {(status === 'ready' || status === 'recording') && renderRecordingPanel()}

      {status === 'ready' && (
        <>
          <div className="card mt-3">
            <h3>Instruções</h3>
            <ul className="text-left">
              <li>Fale naturalmente por <strong>5 a 20 segundos</strong></li>
              <li>Mantenha uma velocidade de fala normal</li>
              <li>Evite pausas longas</li>
              <li>Pode falar sobre qualquer assunto</li>
            </ul>
            <p className="text-muted mt-2">
              <em>Exemplo: Descreva seu dia, fale sobre o clima, conte uma história...</em>
            </p>
          </div>

          <button className="button purple mt-3" onClick={handleStartRecording}>
            🎤 INICIAR GRAVAÇÃO
          </button>
          <button className="button white mt-2" onClick={() => navigate(-1)}>
            VOLTAR
          </button>
        </>
      )}

      {status === 'recording' && (
        <button
          className="button mt-3"
          onClick={handleStopRecording}
          disabled={recordingTime < 5}
        >
          ⏹️ PARAR GRAVAÇÃO {recordingTime >= 5 ? '(Pronto!)' : '(Aguarde...)'}
        </button>
      )}

      {status === 'processing' && (
        <div className="card mt-3">
          <div className="spinner"></div>
          <p>Processando áudio e criando seu perfil vocal...</p>
          <p className="text-muted">Isso pode levar alguns segundos.</p>
        </div>
      )}
    </div>
  );
}
