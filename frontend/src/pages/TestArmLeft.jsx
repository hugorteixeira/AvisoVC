import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TestNavigation from '../components/TestNavigation';

export default function TestArmLeft() {
  const navigate = useNavigate();
  const [testDuration, setTestDuration] = useState(0);
  const [status, setStatus] = useState('ready'); // ready, testing, complete
  const [testPassed, setTestPassed] = useState(true);

  useEffect(() => {
    let interval;
    if (status === 'testing') {
      interval = setInterval(() => {
        setTestDuration((prev) => {
          const newTime = prev + 0.1;
          if (newTime >= 10) {
            finishTest();
          }
          return newTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [status]);

  const startTest = () => {
    setStatus('testing');
    setTestDuration(0);
  };

  const finishTest = () => {
    setStatus('complete');
  };

  const handleAnswer = (answer) => {
    setTestPassed(answer === 'yes');
  };

  const handleContinue = () => {
    if (!testPassed) {
      navigate('/results-attention');
    } else {
      navigate('/test-speech');
    }
  };

  if (status === 'ready') {
    return (
      <div className="container">
        <h1>Teste FAST 3/4 - Braço Esquerdo</h1>
        <p className="text-muted">Protocolo de Detecção de AVC</p>

        <div className="card mt-3">
          <h3>Instruções</h3>
          <ul className="text-left">
            <li>Estenda o <strong>braço esquerdo</strong> à frente, palma para cima</li>
            <li>Mantenha o braço <strong>paralelo ao chão</strong></li>
            <li>Feche os olhos e mantenha por <strong>10 segundos</strong></li>
            <li>O braço deve permanecer firme e estável</li>
          </ul>
          <p className="text-muted mt-2">
            <em>Fraqueza ou queda do braço pode indicar um AVC</em>
          </p>
        </div>

        <div className="card mt-3" style={{ background: 'rgba(255,193,7,0.1)', borderColor: 'var(--warning-yellow)' }}>
          <p className="mb-0">
            <strong>⚠️ Atenção:</strong> Este teste é baseado em auto-avaliação.
            Para maior precisão, seria necessário usar sensores de movimento ou câmera.
          </p>
        </div>

        <div className="test-start-row mt-3">
          <button className="button purple" onClick={startTest}>
            💪 INICIAR TESTE
          </button>
        </div>
        <TestNavigation currentTest="arm-left" />

        <button className="button white mt-2" onClick={() => navigate('/test-arm-right')}>
          VOLTAR
        </button>
      </div>
    );
  }

  if (status === 'testing') {
    return (
      <div className="container">
        <h1>Teste em Andamento</h1>

        <div className="card mt-3 text-center bg-recording">
          <div className="icon" style={{ fontSize: '4rem', marginBottom: '16px' }}>
            💪
          </div>

          <div className="timer">
            {testDuration.toFixed(1)}s
          </div>

          <p className="text-muted">Mantenha o braço esquerdo estendido</p>

          <div className="progress-bar mt-3">
            <div
              className="progress-fill"
              style={{
                width: `${(testDuration / 10) * 100}%`,
                background: 'var(--primary-purple)'
              }}
            ></div>
          </div>

          <p className="text-muted mt-2">
            Faltam {(10 - testDuration).toFixed(1)}s
          </p>
        </div>

        <p className="text-center text-muted mt-3">
          Mantenha os olhos fechados e o braço paralelo ao chão
        </p>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <div className="container">
        <h1>Teste do Braço Esquerdo Completo</h1>

        <div className="card mt-3">
          <h3 style={{ marginBottom: '16px' }}>Avalie o Resultado</h3>
          <p className="mb-3">Seu braço esquerdo permaneceu firme e paralelo ao chão durante os 10 segundos?</p>

          <div style={{ display: 'grid', gap: '12px' }}>
            <button
              className={`button large ${testPassed && testPassed !== null ? 'green' : 'outline'}`}
              onClick={() => handleAnswer('yes')}
            >
              ✓ SIM, ficou estável
            </button>

            <button
              className={`button large ${testPassed === false ? '' : 'outline'}`}
              onClick={() => handleAnswer('no')}
              style={{
                background: testPassed === false ? 'var(--primary-red)' : 'transparent',
                borderColor: testPassed === false ? 'var(--primary-red)' : 'var(--border-color)'
              }}
            >
              ✗ NÃO, caiu ou tremeu
            </button>
          </div>
        </div>

        {testPassed === false && (
          <div className="card mt-3" style={{ background: 'rgba(220,53,69,0.1)', borderColor: 'var(--primary-red)' }}>
            <p className="mb-0" style={{ color: 'var(--primary-red)', fontWeight: '600' }}>
              ⚠️ Fraqueza no braço pode ser um sinal de AVC. Recomendamos acionar a emergência.
            </p>
          </div>
        )}

        <button className="button green large mt-3" onClick={handleContinue}>
          {testPassed ? 'CONTINUAR PARA ÚLTIMO TESTE (4/4)' : 'ACIONAR EMERGÊNCIA'}
        </button>

        <button className="button white mt-2" onClick={() => setStatus('ready')}>
          REFAZER TESTE
        </button>
      </div>
    );
  }

  return null;
}
