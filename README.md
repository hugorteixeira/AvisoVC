# AvisoVC

AvisoVC liga três sinalizadores rápidos:

1. **Escuta ativa** – o navegador envia áudio do microfone para a API FastAPI, que roda `pyannote/voice-activity-detection`. Quando fala é detectada, gravamos 5&nbsp;s em memória, transcrevemos com **Groq API (whisper-large-v3-turbo)** para melhor suporte ao português e devolvemos o texto + palavras por segundo.
2. **Calibração de fala** – estabelece uma linha base da taxa de fala do usuário. Se a taxa de fala cair abaixo de 50% da linha base (possível indicador de AVC ou emergência médica), um alerta vermelho pulsante aparece.
3. **Demo facial** – página WebAssembly usando MediaPipe que monitora landmarks da boca ("boca torta") inteiramente no navegador.

## Pré-requisitos

### 1. Token Hugging Face (para VAD)

1. Aceite os termos em https://hf.co/pyannote/segmentation
2. Aceite os termos em https://hf.co/pyannote/voice-activity-detection
3. Crie um token em https://hf.co/settings/tokens e exporte como `HF_TOKEN`:

```bash
export HF_TOKEN=hf_xxx
```

### 2. API Key Groq (para transcrição)

1. Crie uma conta em https://console.groq.com
2. Gere uma API key em https://console.groq.com/keys
3. Exporte a chave como `GROQ_API_KEY`:

```bash
export GROQ_API_KEY=gsk_xxx
```

### 3. Instale dependências

Instale todas as dependências no ambiente virtual:

```bash
python -m venv venv_avisovc
source venv_avisovc/bin/activate  # Linux/Mac
# ou
venv_avisovc\Scripts\activate  # Windows

pip install -r requirements.txt
```

> **Nota**: VAD roda localmente (pyannote), mas a transcrição usa Groq API (muito mais rápido e melhor para português que whisper-base local).

## Executando a API + frontend

### Método simples (recomendado):

```bash
python run_backend.py
```

### Método alternativo:

```bash
uvicorn aviso_vc.api:app --host 0.0.0.0 --port 8000
```

O servidor estará disponível em http://localhost:8000

### Usando a interface:

1. Abra http://localhost:8000 no navegador

2. **Calibração (recomendado)**:
   - Clique em "Calibrar"
   - Fale naturalmente por 5-20 segundos
   - Clique em "Finalizar calibração"
   - O sistema estabelece sua taxa de fala normal

3. **Escuta ativa**:
   - Clique em "Iniciar microfone"
   - Permita o acesso ao microfone
   - O sistema detecta fala automaticamente e transcreve em tempo real
   - Se calibrado, mostra alerta se fala estiver muito lenta (< 50% da linha base)

4. **Detecção facial**:
   - Clique em "Iniciar detecção facial" para rodar o demo MediaPipe inteiramente no navegador

### Endpoints principais

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/audio-chunk` | Recebe áudio PCM (base64), roda VAD + Groq API e responde com status e transcrição. |
| `GET` | `/api/sessions/{session_id}` | Lista todas as transcrições já emitidas para a sessão. |
| `POST` | `/api/calibration/{session_id}/start` | Inicia calibração da taxa de fala. |
| `POST` | `/api/calibration/{session_id}/finish` | Finaliza calibração e calcula linha base. |
| `GET` | `/api/calibration/{session_id}/status` | Retorna status da calibração e alertas. |
| `POST` | `/api/calibration/{session_id}/dismiss-warning` | Dispensa alerta de fala lenta. |
| `GET` | `/` | Serve `frontend/index.html` com o painel triplo. |
| `GET` | `/healthz` | Health-check simples. |

### Sessão/estado

O frontend gera um `session_id` único e envia blocos consecutivos. O backend mantém o estado "listening → recording → transcribing" por sessão e volta a ouvir logo após concluir cada transcrição Groq.

## CLI offline (opcional)

Ainda é possível rodar o pipeline em arquivos locais:

```bash
python run_pipeline.py path/to/audio.wav \
    --segment-duration 5 \
    --output-dir speech_segments
```

Esse fluxo usa o mesmo VAD + Groq API, mas lê de um WAV estático e salva cada segmento em disco.

## Configuração

Todas as configurações estão em `aviso_vc/config.py`:

- `vad_model_id`: Modelo pyannote para VAD (padrão: `pyannote/voice-activity-detection`)
- `groq_model`: Modelo Groq para transcrição (padrão: `whisper-large-v3-turbo`)
- `segment_duration`: Duração dos segmentos de áudio em segundos (padrão: 5.0)
- `stream_sample_rate`: Taxa de amostragem do stream (padrão: 16000)

## Variáveis de ambiente necessárias

```bash
export HF_TOKEN="hf_xxx"           # Token Hugging Face
export GROQ_API_KEY="gsk_xxx"      # API Key Groq
```

## Funcionalidade de Calibração

A calibração estabelece uma linha base da taxa de fala do usuário para detectar possíveis emergências médicas.

**Como funciona:**
1. Durante a calibração, o usuário fala naturalmente por 5-20 segundos
2. O sistema transcreve e calcula: `caracteres_por_segundo = total_caracteres / duração`
3. **⚠️ IMPORTANTE:** A duração da calibração define quanto áudio será capturado em cada segmento
   - Calibrou por 8 segundos? → Segmentos terão 8 segundos
   - Calibrou por 15 segundos? → Segmentos terão 15 segundos
4. Nas transcrições seguintes, se a taxa cair abaixo de 50% da linha base, um alerta vermelho aparece
5. O alerta persiste até ser dispensado clicando nele

**Exemplo:**
- Calibração: 10 segundos, 425 caracteres = 42.5 caracteres/segundo
- Limiar de alerta: 21.25 caracteres/segundo (50%)
- Segmentos futuros: também 10 segundos (mesma duração da calibração)
- Se uma transcrição de 10s tiver apenas 150 caracteres (15 chars/s) → Alerta!

⚠️ **Aviso importante:** Este não é um software de diagnóstico médico. Use apenas para monitoramento e conscientização. Sempre consulte um profissional médico em caso de emergência.

Para mais detalhes técnicos, veja [CALIBRATION_FEATURE.md](CALIBRATION_FEATURE.md)
