# AvisaVC - Guia de Construção do Frontend

## Estrutura de Pastas

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── ProgressBar.jsx
│   │   └── Header.jsx
│   ├── pages/            # Páginas do app (21 telas)
│   │   ├── Welcome.jsx           # Tela 1
│   │   ├── Register.jsx          # Tela 2
│   │   ├── Question.jsx          # Telas 3-10 (componente reutilizável)
│   │   ├── RiskResult.jsx        # Tela 11
│   │   ├── VoiceRecording.jsx    # Tela 12
│   │   ├── FaceRecording.jsx     # Tela 13
│   │   ├── ProfileCreated.jsx    # Tela 14
│   │   ├── Dashboard.jsx         # Tela 15
│   │   ├── TestFacial.jsx        # Tela 16
│   │   ├── TestArmRight.jsx      # Tela 17
│   │   ├── TestArmLeft.jsx       # Tela 18
│   │   ├── TestSpeech.jsx        # Tela 19
│   │   ├── ResultsOK.jsx         # Tela 20
│   │   └── ResultsAttention.jsx  # Tela 21
│   ├── contexts/
│   │   └── AppContext.jsx        # Estado global
│   ├── utils/
│   │   ├── audioUtils.js         # Integração com calibração
│   │   ├── faceDetection.js      # MediaPipe integration
│   │   └── api.js                # Chamadas ao backend
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx
│   └── index.js
└── package.json
```

## Instalação

```bash
cd frontend
npm install
npm start
```

## Rotas (React Router)

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/" element={<Welcome />} />
  <Route path="/register" element={<Register />} />
  <Route path="/question/:id" element={<Question />} />
  <Route path="/risk-result" element={<RiskResult />} />
  <Route path="/voice-recording" element={<VoiceRecording />} />
  <Route path="/face-recording" element={<FaceRecording />} />
  <Route path="/profile-created" element={<ProfileCreated />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/test-facial" element={<TestFacial />} />
  <Route path="/test-arm-right" element={<TestArmRight />} />
  <Route path="/test-arm-left" element={<TestArmLeft />} />
  <Route path="/test-speech" element={<TestSpeech />} />
  <Route path="/results-ok" element={<ResultsOK />} />
  <Route path="/results-attention" element={<ResultsAttention />} />
</Routes>
```

## Integração com Backend Existente

### API de Calibração de Voz (já existe)
```javascript
// src/utils/api.js
export const startCalibration = async (sessionId) => {
  const res = await fetch(`/api/calibration/${sessionId}/start`, { method: 'POST' });
  return res.json();
};

export const finishCalibration = async (sessionId) => {
  const res = await fetch(`/api/calibration/${sessionId}/finish`, { method: 'POST' });
  return res.json();
};
```

### Processamento de Áudio (adaptar código existente)
```javascript
// src/utils/audioUtils.js
// Copiar funções de frontend/static/app.js:
// - downsampleBuffer
// - floatTo16BitPCM
// - bytesToBase64
// - sendChunk
```

### Detecção Facial (adaptar MediaPipe existente)
```javascript
// src/utils/faceDetection.js
// Integrar código de frontend/static/mouth.js
// Usar @mediapipe/face_mesh
```

## Principais Componentes

### 1. Componente de Questionário (Telas 3-10)

```jsx
// src/pages/Question.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const QUESTIONS = [
  { id: 1, text: "Você tem pressão alta (hipertensão)?", points: 3 },
  { id: 2, text: "Você tem diabetes (Tipo 1 ou 2)?", points: 3 },
  // ... mais 6 perguntas
];

export default function Question() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { riskScore, setRiskScore } = useApp();

  const question = QUESTIONS[parseInt(id) - 1];
  const progress = (parseInt(id) / 8) * 100;

  const handleAnswer = (isYes) => {
    if (isYes) setRiskScore(riskScore + question.points);

    if (parseInt(id) < 8) {
      navigate(`/question/${parseInt(id) + 1}`);
    } else {
      navigate('/risk-result');
    }
  };

  return (
    <div className="container">
      <div className="progress-header">
        <span>Pergunta {id} de 8</span>
        <ProgressBar value={progress} />
      </div>
      <Card>
        <h2>{question.text}</h2>
        <Button color="red" onClick={() => handleAnswer(true)}>SIM</Button>
        <Button color="green" onClick={() => handleAnswer(false)}>NÃO</Button>
      </Card>
    </div>
  );
}
```

### 2. Dashboard (Tela 15)

```jsx
// src/pages/Dashboard.jsx
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, getRiskLevel, baselineVoice } = useApp();
  const risk = getRiskLevel();
  const navigate = useNavigate();

  const callEmergency = () => {
    window.location.href = `tel:${user.emergencyPhone}`;
  };

  return (
    <div className="dashboard">
      <header>
        <h1>Olá, {user.name}!</h1>
        <p>Monitoramento Ativo 24/7</p>
      </header>

      <Card title="Status de Risco">
        <div style={{ color: risk.color }}>
          <h2>{risk.level}</h2>
          <p>Pontuação: {riskScore}</p>
        </div>
        {risk.level === 'ALTO' && (
          <div className="alert">
            <p>✓ Monitoramento Ativo</p>
            <p>✓ Detecção automática de quedas</p>
            <p>✓ Alerta de inatividade (40s)</p>
          </div>
        )}
      </Card>

      <Button
        color="red"
        size="large"
        onClick={() => navigate('/test-facial')}
      >
        ACIONAR CÓDIGO AVC
      </Button>

      <Card title="Contato de Emergência">
        <p>{user.emergencyName}</p>
        <p>{user.emergencyPhone}</p>
        <Button color="blue" onClick={callEmergency}>
          LIGAR PARA FAMILIAR
        </Button>
      </Card>

      <Card title="Configurações">
        <Button onClick={() => navigate('/question/1')}>
          REFAZER PERFIL DE RISCO
        </Button>
        <Button onClick={() => navigate('/voice-recording')}>
          ATUALIZAR GRAVAÇÃO IA
        </Button>
      </Card>
    </div>
  );
}
```

### 3. Gravação de Voz (Tela 12) - INTEGRAÇÃO COM CALIBRAÇÃO EXISTENTE

```jsx
// src/pages/VoiceRecording.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { startCalibration, finishCalibration } from '../utils/api';

export default function VoiceRecording() {
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(5);
  const { sessionId, setBaselineVoice } = useApp();
  const navigate = useNavigate();

  const startRecording = async () => {
    setRecording(true);

    // Integrar com backend de calibração existente
    await startCalibration(sessionId);

    // Countdown timer
    let remaining = 5;
    const interval = setInterval(() => {
      remaining--;
      setTimer(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        finishRecordingAndSave();
      }
    }, 1000);
  };

  const finishRecordingAndSave = async () => {
    const result = await finishCalibration(sessionId);

    if (result.success) {
      setBaselineVoice({
        baseline: result.baseline_chars_per_second,
        duration: result.duration,
        transcription: result.transcription
      });
      navigate('/face-recording');
    }
  };

  return (
    <div className="container">
      <h1>Gravação de Perfil IA</h1>
      <p>Passo 1 de 2</p>

      <Card>
        <div className="icon">🎤</div>
        <h2>Gravação de Voz</h2>
        <p>Repita a frase claramente:</p>
        <blockquote>"O rato roeu a roupa do rei de Roma"</blockquote>

        {!recording ? (
          <Button color="blue" onClick={startRecording}>
            INICIAR GRAVAÇÃO (5s)
          </Button>
        ) : (
          <div className="recording-active">
            <p>Gravando... {timer}s</p>
          </div>
        )}
      </Card>
    </div>
  );
}
```

### 4. Teste Facial (Tela 16) - INTEGRAÇÃO COM MEDIAPIPE

```jsx
// src/pages/TestFacial.jsx
import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { detectFacialAsymmetry } from '../utils/faceDetection';
import { useApp } from '../contexts/AppContext';

export default function TestFacial() {
  const webcamRef = useRef(null);
  const [result, setResult] = useState(null);
  const { baselineFace } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-start após 2 segundos
    const timeout = setTimeout(() => {
      captureAndAnalyze();
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const captureAndAnalyze = async () => {
    const imageSrc = webcamRef.current.getScreenshot();

    // Comparar com baseline usando MediaPipe
    const asymmetry = await detectFacialAsymmetry(imageSrc, baselineFace);

    const testResult = {
      name: 'Teste Facial',
      passed: asymmetry < 0.15, // threshold
      score: asymmetry
    };

    // Salvar resultado e ir para próximo teste
    localStorage.setItem('testFacial', JSON.stringify(testResult));
    navigate('/test-arm-right');
  };

  return (
    <div className="test-container">
      <header>
        <span>Teste 1 de 4</span>
        <button onClick={() => navigate('/dashboard')}>Cancelar</button>
      </header>

      <div className="camera-container">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          mirrored={true}
        />
        <div className="overlay">
          <p>Posicione o rosto e sorria 😊</p>
          <div className="recording-indicator">Gravando</div>
        </div>
      </div>
    </div>
  );
}
```

## Estilos Globais

```css
/* src/styles/global.css */
:root {
  --primary-red: #dc3545;
  --primary-blue: #007bff;
  --primary-green: #28a745;
  --warning-yellow: #ffc107;
  --bg-dark: #0d1117;
  --bg-card: #161b22;
  --border-color: #30363d;
  --text-primary: #e6edf3;
  --text-secondary: rgba(230, 237, 243, 0.7);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial;
  background: var(--bg-dark);
  color: var(--text-primary);
  line-height: 1.6;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
}

.button {
  background: var(--primary-red);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
  transition: transform 0.2s, opacity 0.2s;
}

.button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.button:disabled {
  background: var(--border-color);
  cursor: not-allowed;
  transform: none;
}

.button.green { background: var(--primary-green); }
.button.blue { background: var(--primary-blue); }
.button.white { background: white; color: #000; }

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary-blue);
  transition: width 0.3s;
}

@media (max-width: 768px) {
  .container {
    padding: 12px;
  }

  .card {
    padding: 16px;
  }
}
```

## Próximos Passos

1. **Instalar dependências:**
   ```bash
   cd frontend
   npm install
   ```

2. **Criar arquivo `public/index.html` básico**

3. **Criar `src/index.js` e `src/App.jsx`**

4. **Implementar todas as 21 páginas** seguindo os modelos acima

5. **Integrar MediaPipe** para detecção facial

6. **Testar integração** com backend FastAPI

7. **Build para produção:**
   ```bash
   npm run build
   ```

8. **Servir via FastAPI** (já configurado para servir frontend/)

## Comandos Úteis

```bash
# Desenvolvimento
npm start

# Build
npm run build

# Testar com backend
cd ..
python run_backend.py
# Acesse http://localhost:8000
```
