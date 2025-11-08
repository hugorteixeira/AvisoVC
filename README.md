# AvisaVC - Detecção Precoce de AVC 🏥

Sistema inteligente de detecção e monitoramento de sinais de AVC usando IA, com frontend React moderno e backend FastAPI.

## 🚀 Início Rápido (3 passos)

### 1️⃣ Configure as chaves API

```bash
export GROQ_API_KEY="sua_chave_groq"
export HF_TOKEN="seu_token_huggingface"
```

**Onde conseguir:**
- **GROQ API**: https://console.groq.com/keys (para transcrição de voz)
- **HF Token**: https://huggingface.co/settings/tokens (para detecção de voz)
  - Aceite os termos: https://hf.co/pyannote/segmentation
  - Aceite os termos: https://hf.co/pyannote/voice-activity-detection

### 2️⃣ Execute o script de inicialização

```bash
./start_app.sh
```

### 3️⃣ Acesse o app

O navegador abrirá automaticamente em: **http://localhost:3000**

---

## 📖 Documentação

- **[START_HERE.md](START_HERE.md)** - Guia completo passo a passo
- **[INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md)** - Funcionalidades implementadas
- **[ARTER_IA_README.md](ARTER_IA_README.md)** - Documentação técnica completa
- **[CALIBRATION_FEATURE.md](CALIBRATION_FEATURE.md)** - Sistema de calibração

## ✨ Funcionalidades Principais

### 🎤 Sistema de Voz
- ✅ **Calibração de Voz** - Estabelece baseline de velocidade de fala (5-20s)
- ✅ **Detecção de Anomalias** - Alerta se fala cai abaixo de 50% do baseline
- ✅ **Transcrição em Tempo Real** - Groq API (Whisper) com suporte a português
- ✅ **Segmentos Adaptativos** - Duração baseada na calibração

### 📹 Sistema Facial
- ✅ **Detecção Facial** - MediaPipe Face Landmarker com GPU
- ✅ **Calibração Facial** - 60 frames de baseline (~3 segundos)
- ✅ **Assimetria em Tempo Real** - Detecta paralisia facial
- ✅ **Threshold Adaptativo** - 3x desvio padrão + persistência de 8 frames

### 🧪 Protocolo FAST
- ✅ **F**ace (Rosto) - Teste de assimetria facial (10s)
- 🔨 **A**rms (Braços) - Teste de estabilidade dos braços
- ✅ **S**peech (Fala) - Teste de velocidade de fala
- ✅ **T**ime (Tempo) - Sistema de alertas em tempo real

### 📊 Dashboard
- ✅ Monitoramento de status do perfil
- ✅ Nível de risco (Baixo/Moderado/Alto)
- ✅ Botão de emergência
- ✅ Acesso rápido aos testes FAST

## 🏗️ Arquitetura

### Backend (Python/FastAPI)
```
aviso_vc/
├── api.py              # Endpoints REST
├── service.py          # Lógica de calibração e sessões
├── transcription.py    # Integração Groq/Whisper
└── config.py           # Configurações
```

### Frontend (React)
```
frontend/src/
├── pages/              # 21 páginas do app
│   ├── Welcome.jsx     # Tela inicial
│   ├── Dashboard.jsx   # Painel principal ✅
│   ├── VoiceRecording.jsx   # Calibração de voz ✅
│   ├── FaceRecording.jsx    # Calibração facial ✅
│   ├── TestFacial.jsx       # Teste FAST - Face ✅
│   └── TestSpeech.jsx       # Teste FAST - Speech ✅
├── utils/
│   ├── api.js          # Comunicação com backend
│   ├── audioRecorder.js     # Gravação de áudio
│   └── faceDetection.js     # MediaPipe integration
├── contexts/
│   └── AppContext.jsx  # Estado global
└── styles/
    └── global.css      # Design responsivo
```

## 🛠️ Instalação Manual

Se preferir rodar separadamente:

### Backend

```bash
# Criar ambiente virtual
python -m venv venv_avisovc
source venv_avisovc/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis
export HF_TOKEN="seu_token"
export GROQ_API_KEY="sua_chave"

# Rodar
python run_pipeline.py
```

Backend estará em: **http://localhost:8000**

### Frontend

```bash
# Entrar na pasta
cd frontend

# Instalar dependências (primeira vez)
npm install

# Rodar
npm start
```

Frontend estará em: **http://localhost:3000**

## 📱 Como Usar

### Fluxo Completo:

1. **Welcome** → Tela inicial com informações
2. **Register** → Cadastro de usuário e contato de emergência
3. **Questions** → 8 perguntas de avaliação de risco
4. **Risk Result** → Resultado do nível de risco
5. **Voice Recording** → Calibração de voz (8-10s falando)
6. **Face Recording** → Calibração facial (3s sorrindo)
7. **Profile Created** → Confirmação de perfil
8. **Dashboard** → Painel principal
9. **Test FAST** → 4 testes de detecção
10. **Results** → Resultados e ações

### Atalho para Testar:

Acesse diretamente:
```
http://localhost:3000/voice-recording  # Começar calibração
http://localhost:3000/dashboard         # Dashboard direto
```

## 🔧 API Endpoints

### Calibração
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/session` | Criar nova sessão |
| POST | `/api/calibration/{id}/start` | Iniciar calibração |
| POST | `/api/calibration/{id}/finish` | Finalizar e calcular baseline |
| GET | `/api/calibration/{id}/status` | Status da calibração |
| POST | `/api/calibration/{id}/dismiss-warning` | Dispensar alerta |

### Áudio
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/audio-chunk/{id}` | Enviar chunk de áudio |
| POST | `/api/start-listening/{id}` | Iniciar escuta |
| POST | `/api/stop-listening/{id}` | Parar escuta |
| GET | `/api/session/{id}/status` | Status da sessão |

### Saúde
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/healthz` | Health check |

## 🎯 Tecnologias

### Backend
- Python 3.13
- FastAPI
- Groq API (whisper-large-v3-turbo)
- pyannote.audio (VAD)
- speechbrain
- torch / torchaudio

### Frontend
- React 18.2
- React Router 6.20
- MediaPipe Tasks Vision 0.10.3
- Web Audio API
- Canvas API

## 🐛 Troubleshooting

### Porta em uso
```bash
# Matar processo na porta 3000 (Frontend)
kill -9 $(lsof -t -i:3000)

# Matar processo na porta 8000 (Backend)
kill -9 $(lsof -t -i:8000)
```

### Reinstalar dependências do frontend
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Ver logs em tempo real
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Câmera/Microfone não funcionam
- Certifique-se de usar **localhost** ou **HTTPS**
- Conceda permissões no navegador
- Chrome: `chrome://settings/content`
- Firefox: `about:preferences#privacy`

### Backend retorna erro 500
- Verifique se `GROQ_API_KEY` está configurado: `echo $GROQ_API_KEY`
- Verifique se `HF_TOKEN` está configurado: `echo $HF_TOKEN`
- Veja os logs: `tail -f logs/backend.log`

### MediaPipe não carrega
- Verifique conexão com internet (carrega do CDN)
- Limpe cache do navegador (Ctrl+Shift+Delete)
- Recarregue a página (Ctrl+F5)

## 📊 Como Funciona a Calibração

### Calibração de Voz:
1. Usuário fala naturalmente por 5-20 segundos
2. Sistema transcreve com Groq API
3. Calcula: `chars_por_segundo = total_chars / duração`
4. Define threshold: `50% do baseline`
5. **Importante**: Segmentos futuros terão mesma duração da calibração

**Exemplo:**
- Calibração: 8 segundos, 340 caracteres
- Baseline: 42.5 chars/s
- Threshold: 21.25 chars/s
- Segmentos futuros: 8 segundos cada
- Alerta se < 170 caracteres em 8s

### Calibração Facial:
1. Usuário sorri por ~3 segundos (60 frames)
2. MediaPipe detecta landmarks faciais
3. Calcula assimetria (skew score)
4. Armazena média e desvio padrão
5. Threshold: max(0.07, 3 * σ)
6. Alerta se assimetria > threshold por 8+ frames

## ⚠️ Avisos Importantes

- ❗ **NÃO é um dispositivo médico aprovado**
- ❗ Use apenas para **monitoramento e conscientização**
- ❗ Em caso de suspeita real de AVC: **LIGUE 192 (SAMU) IMEDIATAMENTE**
- ❗ Consulte sempre um profissional médico
- ✅ Requer permissões de câmera e microfone
- ✅ Funciona melhor com boa iluminação

## 📝 Status do Desenvolvimento

| Componente | Status |
|------------|--------|
| Backend API | ✅ Completo |
| Calibração de Voz | ✅ Completo |
| Calibração Facial | ✅ Completo |
| Teste Facial FAST | ✅ Completo |
| Teste de Fala FAST | ✅ Completo |
| Dashboard | ✅ Completo |
| Teste de Braços | 🔨 Placeholder |
| Cadastro Completo | 🔨 Placeholder |
| Questionário de Risco | 🔨 Em desenvolvimento |
| Sistema de Emergência | 🔨 Simulado |

## 🤝 Contribuindo

Este é um projeto de pesquisa e desenvolvimento. Sugestões e melhorias são bem-vindas!

## 📄 Licença

Ver arquivo LICENSE

---

## 🚀 Começar Agora

```bash
# Clone o repositório (se ainda não fez)
# Configure as variáveis de ambiente
export GROQ_API_KEY="sua_chave"
export HF_TOKEN="seu_token"

# Execute
./start_app.sh
```

**Acesse:** http://localhost:3000

---

**🎉 Pronto para detectar sinais precoces de AVC com IA!**
