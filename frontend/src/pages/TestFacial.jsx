import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { FaceDetector, drawLandmarks } from '../utils/faceDetection';
import TestNavigation from '../components/TestNavigation';

export default function TestFacial() {
  const navigate = useNavigate();
  const { baselineFace } = useApp();

  const [status, setStatus] = useState('init'); // init, ready, testing, analyzing, result, error
  const [testDuration, setTestDuration] = useState(0);
  const [detectionResult, setDetectionResult] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [error, setError] = useState(null);
  const [streamVersion, setStreamVersion] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    initializeTest();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const stream = streamRef.current;

    if (!video || !stream) {
      return;
    }

    let cancelled = false;

    const prepareVideo = async () => {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }

      if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        await new Promise((resolve) => {
          const handler = () => {
            video.removeEventListener('loadedmetadata', handler);
            resolve();
          };
          video.addEventListener('loadedmetadata', handler, { once: true });
        });
      }

      if (cancelled) return;

      try {
        await video.play();
      } catch (playError) {
        console.warn('Não foi possível iniciar o vídeo automaticamente:', playError);
      }

      if (cancelled) return;

      if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    };

    prepareVideo();

    return () => {
      cancelled = true;
    };
  }, [status, streamVersion]);

  const initializeTest = async () => {
    try {
      console.log('🎬 Initializing test facial...');

      // Check if baseline exists
      if (!baselineFace) {
        console.error('❌ No baseline face found');
        setError('Você precisa criar um perfil facial primeiro');
        setStatus('error');
        return;
      }
      console.log('✅ Baseline exists:', baselineFace);

      // Initialize camera
      console.log('📹 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 540 },
        },
        audio: false,
      });
      console.log('✅ Camera access granted');

      streamRef.current = stream;
      setStreamVersion((version) => version + 1);

      if (videoRef.current) {
        console.log('🎥 Setting up video element...');

        // Clear any previous srcObject
        if (videoRef.current.srcObject) {
          console.log('⚠️ Clearing previous video source');
          videoRef.current.srcObject = null;
        }

        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            console.log('✅ Video metadata loaded');
            resolve();
          };
        });

        // Ensure video is ready to play
        try {
          await videoRef.current.play();
          console.log('✅ Video playing');
        } catch (playError) {
          console.error('❌ Error playing video:', playError);
          throw new Error('Não foi possível reproduzir o vídeo da câmera.');
        }

        // Wait for video to have valid dimensions
        console.log('⏳ Waiting for video dimensions...');
        await new Promise((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max
          const checkDimensions = () => {
            attempts++;
            if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
              console.log(`✅ Video dimensions: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
              resolve();
            } else if (attempts >= maxAttempts) {
              console.error(`❌ Timeout waiting for video dimensions after ${attempts} attempts`);
              reject(new Error('Timeout esperando dimensões do vídeo. Tente recarregar a página.'));
            } else {
              console.log(`⏳ Video dimensions not ready yet... (attempt ${attempts}/${maxAttempts})`);
              setTimeout(checkDimensions, 100);
            }
          };
          checkDimensions();
        });

        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          console.log(`✅ Canvas set to ${canvasRef.current.width}x${canvasRef.current.height}`);
        }
      }

      // Initialize face detector
      console.log('🤖 Initializing face detector...');
      faceDetectorRef.current = new FaceDetector();
      await faceDetectorRef.current.init();
      console.log('✅ Face detector initialized');

      // Load baseline
      console.log('📊 Loading baseline...');
      faceDetectorRef.current.loadBaseline(baselineFace);
      console.log('✅ Baseline loaded');

      setStatus('ready');
      console.log('✅ Test facial ready!');
    } catch (err) {
      console.error('❌ Failed to initialize test:', err);
      setError(err.message || 'Não foi possível iniciar o teste');
      setStatus('error');
    }
  };

  const handleStartTest = () => {
    console.log('handleStartTest called');
    console.log('faceDetectorRef:', faceDetectorRef.current);
    console.log('videoRef:', videoRef.current);
    console.log('video dimensions:', videoRef.current?.videoWidth, videoRef.current?.videoHeight);

    if (!faceDetectorRef.current || !videoRef.current) {
      console.error('Sistema não inicializado');
      setError('Sistema não inicializado');
      setStatus('error');
      return;
    }

    // Validate video is ready
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      console.error('Vídeo não está pronto');
      setError('Vídeo ainda não está pronto. Aguarde um momento e tente novamente.');
      setStatus('error');
      return;
    }

    console.log('Starting test...');
    setStatus('testing');
    setTestDuration(0);
    setCurrentStatus('Analisando...');

    // Start timer (10 seconds test)
    timerRef.current = setInterval(() => {
      setTestDuration((prev) => {
        const newTime = prev + 0.1;
        if (newTime >= 10) {
          finishTest();
        }
        return newTime;
      });
    }, 100);

    // Start detection loop
    detectLoop();
  };

  const detectLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const detector = faceDetectorRef.current;

    // Stop if required resources are not available
    if (!video || !canvas || !ctx || !detector) {
      console.warn('Detection loop stopped: missing resources');
      return;
    }

    try {
      const timestamp = performance.now();
      const result = detector.detectFrame(video, timestamp);

      // Clear and draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (result.faceDetected) {
        // Draw landmarks
        if (result.landmarks) {
          drawLandmarks(
            ctx,
            result.landmarks,
            canvas.width,
            canvas.height,
            result.status === 'alert'
          );
        }

        // Update status
        if (result.status === 'alert') {
          setCurrentStatus('⚠️ ASSIMETRIA DETECTADA!');
          setDetectionResult(result);
        } else if (result.status === 'ok') {
          setCurrentStatus('✓ Normal');
        }
      } else if (result.status === 'no_video') {
        // Video not ready yet, wait a bit
        setCurrentStatus('Aguardando vídeo...');
      } else {
        setCurrentStatus('Posicione seu rosto na câmera');
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(detectLoop);
    } catch (err) {
      console.error('Detection error:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  const finishTest = () => {
    // Stop timer and animation
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setStatus('analyzing');

    // Brief delay to show analyzing state
    setTimeout(() => {
      setStatus('result');
    }, 1000);
  };

  const handleContinue = () => {
    cleanup();
    if (detectionResult && detectionResult.status === 'alert') {
      // Skip to results attention
      navigate('/results-attention');
    } else {
      // Continue to speech test
      navigate('/test-speech');
    }
  };

  const handleRetry = () => {
    if (faceDetectorRef.current) {
      faceDetectorRef.current.reset();
      if (baselineFace) {
        faceDetectorRef.current.loadBaseline(baselineFace);
      }
    }
    setStatus('ready');
    setTestDuration(0);
    setCurrentStatus('');
    setDetectionResult(null);
    setError(null);
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (faceDetectorRef.current) {
      faceDetectorRef.current.cleanup();
    }
  };

  // Render states
  if (status === 'init') {
    return (
      <div className="container">
        <div className="spinner"></div>
        <p>Inicializando teste facial...</p>
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

  if (status === 'result') {
    const hasAlert = detectionResult && detectionResult.status === 'alert';

    return (
      <div className="container">
        <div className={`icon ${hasAlert ? 'danger' : 'success'}`}>
          {hasAlert ? '⚠️' : '✓'}
        </div>
        <h1>Teste Facial {hasAlert ? 'COM ALERTA' : 'OK'}</h1>

        <div className={`card mt-3 ${hasAlert ? 'alert danger' : 'alert success'}`}>
          {hasAlert ? (
            <>
              <h3>Assimetria Facial Detectada</h3>
              <p className="mt-2">
                O teste detectou uma assimetria significativa em sua expressão facial.
                Isso pode ser um sinal de alerta.
              </p>
              {detectionResult && (
                <div className="mt-2">
                  <p><strong>Índice de assimetria:</strong> {detectionResult.skewScore?.toFixed(4)}</p>
                  <p><strong>Baseline:</strong> {detectionResult.baseline?.toFixed(4)}</p>
                  <p><strong>Diferença:</strong> {detectionResult.delta?.toFixed(4)}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h3>Teste Facial Normal</h3>
              <p className="mt-2">
                Nenhuma assimetria significativa foi detectada em sua expressão facial.
              </p>
            </>
          )}
        </div>

        {hasAlert ? (
          <>
            <div className="card mt-2 bg-info">
              <p className="mb-0">
                <strong>⚠️ Recomendação:</strong> Devido ao resultado do teste,
                recomendamos que você acione a emergência imediatamente.
              </p>
            </div>
            <button className="button mt-3" onClick={() => navigate('/results-attention')}>
              ACIONAR EMERGÊNCIA
            </button>
            <button className="button green mt-2" onClick={handleContinue}>
              CONTINUAR PARA TESTE DE FALA
            </button>
            <button className="button white mt-2" onClick={handleRetry}>
              REFAZER TESTE
            </button>
          </>
        ) : (
          <>
            <button className="button green mt-3" onClick={handleContinue}>
              CONTINUAR PARA TESTE DE FALA
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
        <p className="text-muted">Processando dados do teste facial</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Teste FAST 1/4 - Face (Rosto)</h1>
      <p className="text-muted">Protocolo de Detecção de AVC</p>

      <div className="video-container mt-3">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: status === 'testing' ? 'none' : 'block' }}
        />
        <canvas
          ref={canvasRef}
          style={{ display: status === 'testing' ? 'block' : 'none', minHeight: '360px' }}
        />

        {status === 'init' && (
          <div className="video-overlay">
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.8)',
              padding: '20px 32px',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '600',
              textAlign: 'center',
            }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              Carregando câmera...
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className="video-overlay">
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              padding: '12px 24px',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              textAlign: 'center',
            }}>
              📹 Câmera ativa - Pronto para iniciar
            </div>
          </div>
        )}

        {status === 'testing' && (
          <div className="video-overlay">
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              padding: '16px 32px',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.2rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
                {testDuration.toFixed(1)}s
              </div>
              <div>{currentStatus}</div>
            </div>
          </div>
        )}
      </div>

      {status === 'testing' && (
        <div className="card mt-3">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(testDuration / 10) * 100}%`,
                background: detectionResult?.status === 'alert'
                  ? 'var(--primary-red)'
                  : 'var(--primary-green)'
              }}
            ></div>
          </div>
          <p className="text-center text-muted mt-2">
            Mantenha o sorriso por {(10 - testDuration).toFixed(1)}s
          </p>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="test-start-row mt-3">
            <button className="button purple" onClick={handleStartTest}>
              😊 INICIAR TESTE FACIAL
            </button>
          </div>
          <TestNavigation currentTest="face" />
          <button className="button white mt-2" onClick={() => navigate('/dashboard')}>
            CANCELAR
          </button>
        </>
      )}
    </div>
  );
}
