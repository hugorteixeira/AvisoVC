# Roadmap de Implementação - AvisaVC Frontend

## ✅ Já Criado

1. **Estrutura Base**
   - ✅ `package.json` com dependências
   - ✅ `src/contexts/AppContext.jsx` - Estado global
   - ✅ `src/App.jsx` - Roteamento
   - ✅ `src/index.js` - Entry point
   - ✅ `public/index.html` - HTML base
   - ✅ `src/styles/global.css` - Estilos globais
   - ✅ `src/pages/Welcome.jsx` - Exemplo completo (Tela 1)

2. **Documentação**
   - ✅ `FRONTEND_BUILD_GUIDE.md` - Guia técnico completo
   - ✅ Este arquivo - Roadmap de implementação

## 📋 Próximos Passos (Ordem de Prioridade)

### Fase 1: Componentes Básicos
Crie estes componentes reutilizáveis em `src/components/`:

```jsx
// src/components/Button.jsx
export default function Button({ children, color = 'red', onClick, disabled, className = '' }) {
  return (
    <button
      className={`button ${color} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// src/components/Card.jsx
export default function Card({ title, children }) {
  return (
    <div className="card">
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
}

// src/components/ProgressBar.jsx
export default function ProgressBar({ value }) {
  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

// src/components/InputField.jsx
export default function InputField({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
```

### Fase 2: Páginas de Onboarding (Prioridade Alta)

#### 1. Registro (Tela 2)
```bash
touch frontend/src/pages/Register.jsx
```

**Implementar:**
- Formulário com nome, idade, contato de emergência
- Validação de campos
- Salvamento no Context
- Navegação para `/question/1`

**Código exemplo:**
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import InputField from '../components/InputField';
import Button from '../components/Button';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: ''
  });
  const { setUser } = useApp();
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!formData.name || !formData.emergencyPhone) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    setUser(formData);
    navigate('/question/1');
  };

  return (
    <div className="container">
      <h1>Cadastro Inicial</h1>
      <p>Preencha seus dados para configurar o monitoramento</p>

      <div className="card">
        <h3>Seus Dados</h3>
        <InputField
          label="Nome Completo"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Digite seu nome completo"
        />
        <InputField
          label="Idade"
          type="number"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          placeholder="Digite sua idade"
        />

        <h3 style={{ marginTop: '20px' }}>Contato de Emergência</h3>
        <InputField
          label="Nome do Contato"
          value={formData.emergencyName}
          onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
          placeholder="Nome completo"
        />
        <InputField
          label="Telefone do Contato"
          type="tel"
          value={formData.emergencyPhone}
          onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
          placeholder="(00) 00000-0000"
        />
        <InputField
          label="Parentesco"
          value={formData.emergencyRelation}
          onChange={(e) => setFormData({ ...formData, emergencyRelation: e.target.value })}
          placeholder="Ex: Filho, Filha, Cônjuge"
        />
      </div>

      <Button onClick={handleSubmit}>
        CONTINUAR PARA QUESTIONÁRIO
      </Button>
    </div>
  );
}
```

#### 2. Questionário (Telas 3-10)
```bash
touch frontend/src/pages/Question.jsx
```

Ver exemplo completo no `FRONTEND_BUILD_GUIDE.md`

#### 3. Resultado de Risco (Tela 11)
```bash
touch frontend/src/pages/RiskResult.jsx
```

### Fase 3: Perfil IA com Integração Backend

#### 4. Gravação de Voz (Tela 12)
```bash
touch frontend/src/pages/VoiceRecording.jsx
touch frontend/src/utils/api.js
```

**INTEGRAR com backend existente:**
- Usar endpoints `/api/calibration/{sessionId}/start` e `/finish`
- Reutilizar lógica de `frontend/static/app.js`
- Ver exemplo no `FRONTEND_BUILD_GUIDE.md`

#### 5. Gravação Facial (Tela 13)
```bash
touch frontend/src/pages/FaceRecording.jsx
touch frontend/src/utils/faceDetection.js
```

**INTEGRAR com MediaPipe:**
- Reutilizar código de `frontend/static/mouth.js`
- Usar `react-webcam` para captura
- Salvar baseline no Context

#### 6. Perfil Criado (Tela 14)
```bash
touch frontend/src/pages/ProfileCreated.jsx
```

### Fase 4: Dashboard e Testes

#### 7. Dashboard (Tela 15)
```bash
touch frontend/src/pages/Dashboard.jsx
```

Ver exemplo completo no `FRONTEND_BUILD_GUIDE.md`

#### 8-11. Testes FAST (Telas 16-19)
```bash
touch frontend/src/pages/TestFacial.jsx
touch frontend/src/pages/TestArmRight.jsx
touch frontend/src/pages/TestArmLeft.jsx
touch frontend/src/pages/TestSpeech.jsx
```

**Teste Facial:**
- Integrar MediaPipe
- Comparar com baseline
- Salvar resultado

**Testes de Braço:**
- Usar Accelerometer API (se disponível em web)
- Timer de 10 segundos
- Detectar estabilidade

**Teste de Fala:**
- Reutilizar calibração de voz
- Comparar com baseline
- Calcular chars/second

#### 12-13. Resultados (Telas 20-21)
```bash
touch frontend/src/pages/ResultsOK.jsx
touch frontend/src/pages/ResultsAttention.jsx
```

## 🔧 Utilitários Necessários

### api.js
```jsx
// src/utils/api.js
const API_BASE = '';  // Mesmo servidor

export async function startCalibration(sessionId) {
  const res = await fetch(`/api/calibration/${sessionId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function finishCalibration(sessionId) {
  const res = await fetch(`/api/calibration/${sessionId}/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function sendAudioChunk(sessionId, samples, sampleRate) {
  const res = await fetch('/api/audio-chunk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      sample_rate: sampleRate,
      samples
    })
  });
  return res.json();
}
```

### audioUtils.js
Copiar de `frontend/static/app.js`:
- `downsampleBuffer()`
- `floatTo16BitPCM()`
- `bytesToBase64()`

### faceDetection.js
Copiar de `frontend/static/mouth.js` e adaptar para React

## 📱 Responsividade

Já implementada no `global.css`:
- Breakpoint 768px para tablets
- Breakpoint 480px para mobile
- Layout flexível com containers

## 🎨 Customização de Cores

Altere as variáveis CSS em `global.css`:
```css
:root {
  --primary-red: #dc3545;      /* Cor principal (botões de perigo)
  --primary-blue: #007bff;     /* Botões secundários */
  --primary-green: #28a745;    /* Sucesso */
  --primary-purple: #6f42c1;   /* Testes/Câmera */
  /* ... outras cores */
}
```

## 🚀 Como Rodar

1. **Instalar dependências:**
```bash
cd frontend
npm install
```

2. **Desenvolvimento:**
```bash
npm start
# Abre em http://localhost:3000
```

3. **Build para produção:**
```bash
npm run build
# Cria pasta build/
```

4. **Integrar com backend:**
```bash
# Terminal 1
cd frontend && npm start

# Terminal 2
cd .. && python run_backend.py

# Backend proxy configurado para servir React
```

## ✅ Checklist de Implementação

- [ ] Fase 1: Componentes Básicos (Button, Card, ProgressBar, InputField)
- [ ] Fase 2: Onboarding (Welcome ✅, Register, Question, RiskResult)
- [ ] Fase 3: Perfil IA (VoiceRecording, FaceRecording, ProfileCreated)
- [ ] Fase 4: Dashboard e Testes
- [ ] Integração com backend de calibração
- [ ] Integração com MediaPipe
- [ ] Testes FAST completos
- [ ] Páginas de resultado
- [ ] Responsividade testada
- [ ] Build de produção

## 🐛 Troubleshooting

**React não encontra módulos:**
```bash
npm install react react-dom react-router-dom react-webcam
```

**Erro de CORS:**
- Backend já configurado para servir frontend
- Use `npm start` em desenvolvimento (proxy automático)

**MediaPipe não carrega:**
```bash
npm install @mediapipe/face_mesh
```

## 📚 Recursos

- [React Router Docs](https://reactrouter.com/)
- [React Webcam](https://www.npmjs.com/package/react-webcam)
- [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh.html)
- Backend API: `http://localhost:8000/docs` (FastAPI auto-docs)

Boa sorte com a implementação! 🚀
