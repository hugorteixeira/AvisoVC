import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { AudioRecorder, visualizeAudioLevel } from '../utils/audioRecorder';
import { sendAudioChunk, getCalibrationStatus } from '../utils/api';
import TestNavigation from '../components/TestNavigation';

export default function TestSpeech() {
  const navigate = useNavigate();
  const { baselineVoice } = useApp();

  const [status, setStatus] = useState('init'); // init, ready, testing, analyzing, result, error
  const [testDuration, setTestDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [warningDetected, setWarningDetected] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const audioRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioLevelIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    initializeTest();
    return () => {
      cleanup();
    };
  }, []);

  const initializeTest = async () => {
    try {
      // Check if baseline exists
      if (!baselineVoice || !baselineVoice.sessionId) {
        setError('Você precisa criar um perfil de voz primeiro');
        setStatus('error');
        return;
      }

      sessionIdRef.current = baselineVoice.sessionId;

      // Verify calibration status (best effort)
      try {
        await getCalibrationStatus(baselineVoice.sessionId);
        setOfflineMode(false);
      } catch (verifyError) {
        console.warn('Falha ao verificar perfil de voz. Prosseguindo em modo offline.', verifyError);
        setOfflineMode(true);
      }

      // Initialize audio recorder
      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.init();

      setStatus('ready');
    } catch (err) {
      console.error('Failed to initialize test:', err);
      setError(err.message || 'Não foi possível iniciar o teste');
      setStatus('error');
    }
  };

  const handleStartTest = async () => {
    if (!audioRecorderRef.current || !sessionIdRef.current) {
      setError('Sistema não inicializado');
      return;
    }

    setStatus('testing');
    setTestDuration(0);
    setTranscription('');
    setWarningDetected(false);

    // Start timer
    timerRef.current = setInterval(() => {
      setTestDuration((prev) => {
        const newTime = prev + 0.1;
        // Test duration matches calibration duration (from baselineVoice)
        const targetDuration = baselineVoice.duration || 10;
        if (newTime >= targetDuration) {
          handleStopTest();
        }
        return newTime;
      });
    }, 100);

    // Start recording with chunks sent to backend
    audioRecorderRef.current.startRecording(async (audioChunk) => {
      try {
        // Send chunk to backend for analysis
        const response = await sendAudioChunk(sessionIdRef.current, audioChunk);

        if (response.transcript && response.transcript.text) {
          setTranscription(response.transcript.text);
        }

        if (response.warning_active) {
          setWarningDetected(true);
        }
      } catch (err) {
        console.error('Failed to process audio chunk:', err);
      }
    }, 1000);

    // Start audio level monitoring
    audioLevelIntervalRef.current = audioRecorderRef.current.startAudioLevelMonitoring(
      (level) => setAudioLevel(level),
      100
    );
  };

  const handleStopTest = async () => {
    // Clear intervals
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    if (!audioRecorderRef.current) return;

    setStatus('analyzing');

    try {
      // Stop recording
      await audioRecorderRef.current.stopRecording();

      setResult({
        warningDetected: warningDetected,
        transcription: transcription,
        baseline: baselineVoice.baseline,
        duration: testDuration,
      });

      // Get final calibration status (best effort)
      try {
        const calibrationStatus = await getCalibrationStatus(sessionIdRef.current);
        setResult((prev) => ({
          ...prev,
          warningDetected: prev.warningDetected || calibrationStatus.warning_active
        }));
      } catch (err) {
        console.warn('Não foi possível validar status final do backend. Mantendo dados locais.', err);
      }

      setStatus('result');
    } catch (err) {
      console.error('Failed to finish test:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  const handleContinue = () => {
    cleanup();
    if (result && result.warningDetected) {
      navigate('/results-attention');
    } else {
      navigate('/results-ok');
    }
  };

  const handleRetry = () => {
    setStatus('ready');
    setTestDuration(0);
    setAudioLevel(0);
    setTranscription('');
    setResult(null);
    setWarningDetected(false);
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

  // Render states
  if (status === 'init') {
    return (
      <div className="container">
        <div className="spinner"></div>
        <p>Inicializando teste de fala...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container">
        <div className="icon danger">⚠️</div>
        <h1>Erro</h1>
        <p className="text-danger">{error}</p>
        <button className="button" onClick={initializeTest}>
          TENTAR NOVAMENTE
        </button>
        <button className="button white mt-2" onClick={() => navigate('/dashboard')}>
          VOLTAR AO DASHBOARD
        </button>
      </div>
    );
  }

  if (status === 'result' && result) {
    const hasWarning = result.warningDetected;

    return (
      <div className="container">
        <div className={`icon ${hasWarning ? 'danger' : 'success'}`}>
          {hasWarning ? '⚠️' : '✓'}
        </div>
        <h1>Teste de Fala {hasWarning ? 'COM ALERTA' : 'OK'}</h1>

        <div className={`card mt-3 ${hasWarning ? 'alert danger' : 'alert success'}`}>
          {hasWarning ? (
            <>
              <h3>Alteração na Fala Detectada</h3>
              <p className="mt-2">
                O teste detectou uma queda significativa na sua velocidade de fala
                em comparação com seu perfil baseline.
              </p>
              <div className="mt-2">
                {typeof result.baseline === 'number' && (
                  <p><strong>Baseline:</strong> {result.baseline.toFixed(2)} caracteres/segundo</p>
                )}
                <p><strong>Duração:</strong> {result.duration.toFixed(1)}s</p>
              </div>
            </>
          ) : (
            <>
              <h3>Teste de Fala Normal</h3>
              <p className="mt-2">
                Sua velocidade de fala está dentro do padrão esperado.
              </p>
              <div className="mt-2">
                {typeof result.baseline === 'number' && (
                  <p><strong>Baseline:</strong> {result.baseline.toFixed(2)} caracteres/segundo</p>
                )}
                <p><strong>Duração:</strong> {result.duration.toFixed(1)}s</p>
              </div>
            </>
          )}
        </div>

        {result.transcription && (
          <div className="card mt-2">
            <h3>Transcrição</h3>
            <p className="text-muted mt-2"><em>"{result.transcription}"</em></p>
          </div>
        )}

        {hasWarning ? (
          <>
            <div className="card mt-2 bg-info">
              <p className="mb-0">
                <strong>⚠️ Recomendação:</strong> Alterações na fala podem ser um
                sinal de AVC. Recomendamos acionar a emergência.
              </p>
            </div>
            <button className="button mt-3" onClick={() => navigate('/results-attention')}>
              ACIONAR EMERGÊNCIA
            </button>
            <button className="button white mt-2" onClick={handleRetry}>
              REFAZER TESTE
            </button>
          </>
        ) : (
          <>
            <button className="button green mt-3" onClick={handleContinue}>
              FINALIZAR TESTES
            </button>
            <button className="button white mt-2" onClick={handleRetry}>
              REFAZER TESTE
            </button>
          </>
        )}
      </div>
    );
  }

  if (status === 'analyzing') {
    return (
      <div className="container">
        <div className="spinner"></div>
        <h1>Analisando Resultados...</h1>
        <p className="text-muted">Processando dados do teste de fala</p>
      </div>
    );
  }

  const targetDuration = baselineVoice?.duration || 10;
  const baselineCharsPerSecond = typeof baselineVoice?.baseline === 'number'
    ? baselineVoice.baseline
    : null;

  return (
    <div className="container">
      <h1>Teste FAST 4/4 - Speech (Fala)</h1>
      <p className="text-muted">Protocolo de Detecção de AVC</p>

      {status === 'ready' && (
        <>
          <div className="card mt-3">
            <h3>Instruções</h3>
            <ul className="text-left">
              <li>Fale naturalmente por <strong>{targetDuration.toFixed(0)} segundos</strong></li>
              <li>Use a mesma velocidade de fala da calibração</li>
              <li>Pode falar sobre qualquer assunto</li>
              <li>Evite pausas longas</li>
            </ul>
            <p className="text-muted mt-2">
              <em>Exemplo: Descreva o que você fez hoje, fale sobre o clima...</em>
            </p>
            {baselineCharsPerSecond !== null && (
              <p className="text-muted mt-2">
                <strong>Baseline:</strong> {baselineCharsPerSecond.toFixed(2)} caracteres/segundo
              </p>
            )}
          </div>

          {offlineMode && (
            <div className="card mt-3 bg-info">
              <p className="mb-0">
                <strong>ℹ️ Modo offline:</strong> Não conseguimos validar seu perfil no servidor,
                mas você pode continuar usando o padrão salvo no dispositivo.
              </p>
            </div>
          )}
        </>
      )}

      {status === 'testing' && (
        <div className="mt-3">
          <div className="card bg-recording">
            <div className="recording-indicator">
              <span className="recording-dot"></span>
              GRAVANDO
            </div>

            <div className="timer">
              {testDuration.toFixed(1)}s
            </div>

            <div className="audio-visualizer">
              <div className="audio-bars">
                {visualizeAudioLevel(audioLevel)}
              </div>
              <p className="text-muted mt-2">Nível: {audioLevel.toFixed(0)}%</p>
            </div>

            {warningDetected && (
              <div className="alert danger mt-3">
                <strong>⚠️ ALERTA:</strong> Velocidade de fala abaixo do esperado
              </div>
            )}

            {transcription && (
              <div className="mt-3">
                <p className="text-muted"><strong>Transcrevendo:</strong></p>
                <p className="text-muted"><em>"{transcription}"</em></p>
              </div>
            )}

            <div className="mt-3">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(testDuration / targetDuration) * 100}%`,
                    background: warningDetected ? 'var(--primary-red)' : 'var(--primary-purple)'
                  }}
                ></div>
              </div>
              <p className="text-muted mt-1">
                Faltam {(targetDuration - testDuration).toFixed(1)}s
              </p>
            </div>
          </div>

          <button className="button mt-3" onClick={handleStopTest}>
            ⏹️ PARAR TESTE
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
        <div className="test-start-row mt-3">
          <button className="button purple" onClick={handleStartTest}>
            🎤 INICIAR TESTE DE FALA
          </button>
        </div>
        <TestNavigation currentTest="speech" />
          <button className="button white mt-2" onClick={() => navigate('/test-arm-left')}>
            VOLTAR
          </button>
        </>
      )}
    </div>
  );
}
