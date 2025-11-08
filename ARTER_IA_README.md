# AvisaVC - Aplicativo de Detecção Precoce de AVC

## 🎉 O Que Foi Criado

Criei a estrutura completa do frontend React para o **AvisaVC**, integrando as funcionalidades existentes de calibração de voz e detecção facial.

### ✅ Arquivos Criados

**Estrutura Base:**
```
frontend/
├── package.json                    ✅ Dependências React
├── public/
│   └── index.html                  ✅ HTML principal
└── src/
    ├── index.js                    ✅ Entry point
    ├── App.jsx                     ✅ Rotas e navegação
    ├── contexts/
    │   └── AppContext.jsx          ✅ Estado global
    ├── styles/
    │   └── global.css              ✅ Estilos responsivos
    └── pages/                      ✅ Todas as 21 telas (placeholders)
        ├── Welcome.jsx             ✅ COMPLETO - Exemplo
        ├── Register.jsx            ✅ Placeholder
        ├── Question.jsx            ✅ Placeholder
        ├── RiskResult.jsx          ✅ Placeholder
        ├── VoiceRecording.jsx      ✅ Placeholder
        ├── FaceRecording.jsx       ✅ Placeholder
        ├── ProfileCreated.jsx      ✅ Placeholder
        ├── Dashboard.jsx           ✅ Placeholder
        ├── TestFacial.jsx          ✅ Placeholder
        ├── TestArmRight.jsx        ✅ Placeholder
        ├── TestArmLeft.jsx         ✅ Placeholder
        ├── TestSpeech.jsx          ✅ Placeholder
        ├── ResultsOK.jsx           ✅ Placeholder
        └── ResultsAttention.jsx    ✅ Placeholder
```

**Documentação:**
- `FRONTEND_BUILD_GUIDE.md` - Guia técnico completo com exemplos de código
- `IMPLEMENTATION_ROADMAP.md` - Roadmap passo a passo para implementação
- Este arquivo - README principal

### 🚀 Como Iniciar (QUICK START)

```bash
# 1. Instalar dependências
cd frontend
npm install

# 2. Iniciar desenvolvimento
npm start
# Abre em http://localhost:3000

# 3. Em outro terminal, rodar backend
cd ..
export HF_TOKEN="seu_token_hf"
export GROQ_API_KEY="seu_token_groq"
python run_backend.py
# Backend em http://localhost:8000
```

### 📱 Fluxo do Aplicativo (21 Telas)

1. **Welcome** ✅ COMPLETO - Tela de boas-vindas com features
2. **Register** 🔨 Placeholder - Cadastro de usuário e emergência
3-10. **Question** 🔨 Placeholder - 8 perguntas de avaliação de risco
11. **RiskResult** 🔨 Placeholder - Resultado da avaliação
12. **VoiceRecording** 🔨 Placeholder - Gravação baseline de voz
13. **FaceRecording** 🔨 Placeholder - Gravação baseline facial
14. **ProfileCreated** 🔨 Placeholder - Confirmação de perfil
15. **Dashboard** 🔨 Placeholder - Tela principal
16. **TestFacial** 🔨 Placeholder - Teste FAST 1/4
17. **TestArmRight** 🔨 Placeholder - Teste FAST 2/4
18. **TestArmLeft** 🔨 Placeholder - Teste FAST 3/4
19. **TestSpeech** 🔨 Placeholder - Teste FAST 4/4
20. **ResultsOK** 🔨 Placeholder - Testes aprovados
21. **ResultsAttention** 🔨 Placeholder - Atenção necessária

### 🔌 Integração com Backend Existente

**Backend FastAPI já possui:**
- ✅ Calibração de voz (`/api/calibration/*`)
- ✅ Processamento de áudio (`/api/audio-chunk`)
- ✅ Sistema de monitoramento de fala
- ✅ Detecção de anomalias (< 50% baseline)

**Frontend deve integrar:**
- 🔨 Chamadas API em `VoiceRecording.jsx`
- 🔨 MediaPipe em `FaceRecording.jsx` e `TestFacial.jsx`
- 🔨 Testes de braço com sensores (se disponível)
- 🔨 Teste de fala com calibração

### 📋 Próximos Passos (Ordem de Implementação)

#### 1️⃣ Componentes Reutilizáveis (PRIMEIRO)
Criar em `src/components/`:
- `Button.jsx`
- `Card.jsx`
- `ProgressBar.jsx`
- `InputField.jsx`

**Ver exemplos em:** `IMPLEMENTATION_ROADMAP.md`

#### 2️⃣ Implementar Registro (SEGUNDO)
Arquivo: `src/pages/Register.jsx`
- Formulário completo
- Validação
- Salvamento no Context

**Ver código completo em:** `IMPLEMENTATION_ROADMAP.md`

#### 3️⃣ Implementar Questionário (TERCEIRO)
Arquivo: `src/pages/Question.jsx`
- 8 perguntas de risco
- Sistema de pontuação
- Navegação dinâmica

**Ver código completo em:** `FRONTEND_BUILD_GUIDE.md`

#### 4️⃣ Integrar Calibração de Voz
Arquivos:
- `src/pages/VoiceRecording.jsx`
- `src/utils/api.js`

**Código base existente:**
- `frontend/static/app.js` (funções de áudio)
- Backend endpoints já prontos

#### 5️⃣ Integrar Detecção Facial
Arquivos:
- `src/pages/FaceRecording.jsx`
- `src/pages/TestFacial.jsx`
- `src/utils/faceDetection.js`

**Código base existente:**
- `frontend/static/mouth.js` (MediaPipe)

#### 6️⃣ Implementar Dashboard
Arquivo: `src/pages/Dashboard.jsx`
- Status de risco
- Botão de emergência
- Configurações

**Ver código completo em:** `FRONTEND_BUILD_GUIDE.md`

#### 7️⃣ Implementar Testes FAST
Arquivos: `TestFacial.jsx`, `TestArmRight.jsx`, `TestArmLeft.jsx`, `TestSpeech.jsx`

#### 8️⃣ Implementar Resultados
Arquivos: `ResultsOK.jsx`, `ResultsAttention.jsx`

### 🎨 Visual e Responsividade

**Já implementado em `global.css`:**
- ✅ Design escuro (tema médico)
- ✅ Cores baseadas no wireframe
- ✅ Responsivo (Mobile, Tablet, Desktop)
- ✅ Componentes prontos (button, card, progress-bar, etc.)

**Cores do tema:**
- Vermelho: #dc3545 (Perigo/AVC)
- Azul: #007bff (Ações secundárias)
- Verde: #28a745 (Sucesso)
- Amarelo: #ffc107 (Atenção)
- Roxo: #6f42c1 (Câmera/Testes)

### 📚 Documentação Disponível

1. **FRONTEND_BUILD_GUIDE.md**
   - Exemplos completos de código
   - Integração com backend
   - Utilidades de áudio e vídeo
   - Estilos e componentes

2. **IMPLEMENTATION_ROADMAP.md**
   - Checklist passo a passo
   - Ordem de implementação
   - Troubleshooting
   - Comandos úteis

3. **CALIBRATION_FEATURE.md**
   - Documentação da calibração de voz (backend)
   - API endpoints
   - Como funciona o sistema de alertas

4. **GROQ_MIGRATION.md**
   - Integração com Groq API
   - Como usar Whisper para transcrição

### 🐛 Resolução de Problemas

**"npm: command not found"**
```bash
# Instalar Node.js primeiro
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**"Module not found"**
```bash
cd frontend
npm install
```

**"Cannot find module 'react-router-dom'"**
```bash
npm install react-router-dom
```

**CORS errors**
- Backend já configurado para servir React
- Use `npm start` em dev (proxy automático)

### 🔄 Workflow de Desenvolvimento

**Terminal 1 - Frontend:**
```bash
cd frontend
npm start
# Live reload em http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
export HF_TOKEN="..."
export GROQ_API_KEY="..."
python run_backend.py
# API em http://localhost:8000
```

### 📦 Build de Produção

```bash
cd frontend
npm run build
# Cria pasta build/

# Backend serve automaticamente
cd ..
python run_backend.py
# Acesse http://localhost:8000
```

### ✨ Features Especiais

**Já Implementadas:**
- ✅ Roteamento com React Router
- ✅ Estado global com Context API
- ✅ LocalStorage para persistência
- ✅ Rotas protegidas (requer login)
- ✅ Sistema de pontuação de risco
- ✅ Cálculo de nível de risco (Baixo/Médio/Alto)

**A Implementar:**
- 🔨 Gravação de áudio com backend
- 🔨 Detecção facial com MediaPipe
- 🔨 Testes de movimento (braços)
- 🔨 Comparação com baseline
- 🔨 Sistema de alertas
- 🔨 Ligação para emergência

### 🎯 Objetivos do Aplicativo

1. **Prevenção:** Avaliar risco de AVC
2. **Detecção:** Protocolo FAST para identificar sinais
3. **Emergência:** Acionar socorro rapidamente
4. **Monitoramento:** Acompanhamento contínuo

### ⚠️ Avisos Importantes

1. **Não é dispositivo médico:** Apenas monitoramento/conscientização
2. **Requer permissões:** Câmera, microfone, movimento
3. **Backend necessário:** Funcionalidades de IA dependem do backend Python
4. **Tokens necessários:** HF_TOKEN e GROQ_API_KEY

### 📞 Suporte

- Documentação técnica: `FRONTEND_BUILD_GUIDE.md`
- Roadmap: `IMPLEMENTATION_ROADMAP.md`
- Backend: `README.md`
- Calibração: `CALIBRATION_FEATURE.md`

---

## 🚀 Começe Agora!

```bash
cd frontend
npm install
npm start
```

Depois implemente seguindo a ordem em `IMPLEMENTATION_ROADMAP.md`!

**Boa sorte com o AvisaVC! 💪❤️**
