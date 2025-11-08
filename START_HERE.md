# 🚀 Como Rodar o AvisaVC

## 📋 Pré-requisitos

Você precisa ter suas chaves de API configuradas:
- **GROQ_API_KEY** - Para transcrição de voz (Whisper)
- **HF_TOKEN** - Para modelos do Hugging Face

## ⚡ Início Rápido

### Opção 1: Usar o script automático

```bash
# Tornar o script executável
chmod +x start_app.sh

# Rodar tudo de uma vez
./start_app.sh
```

### Opção 2: Rodar manualmente

#### 1️⃣ Rodar o Backend (Terminal 1)

```bash
# Ativar ambiente virtual
source venv_avisovc/bin/activate

# Configurar variáveis de ambiente
export HF_TOKEN="seu_token_aqui"
export GROQ_API_KEY="seu_token_aqui"

# Rodar o backend
python run_pipeline.py
```

O backend estará rodando em: **http://localhost:8000**

#### 2️⃣ Rodar o Frontend (Terminal 2)

```bash
# Entrar na pasta do frontend
cd frontend

# Instalar dependências (apenas primeira vez)
npm install

# Rodar o frontend
npm start
```

O frontend abrirá automaticamente em: **http://localhost:3000**

## 🎯 Testando o Aplicativo

### Fluxo Completo:

1. **Acesse**: http://localhost:3000
2. **Tela Welcome**: Clique em "COMEÇAR CADASTRO"
3. **Cadastro**: Preencha seus dados (ainda em desenvolvimento - pode pular)
4. **Questionário**: Responda as 8 perguntas de risco
5. **Resultado de Risco**: Veja seu nível de risco
6. **Calibração de Voz**: Fale por 8-10 segundos
7. **Calibração Facial**: Sorria para a câmera (~3s)
8. **Dashboard**: Acesse o painel principal
9. **Teste FAST**: Execute os 4 testes de detecção de AVC

### Atalho para Testar Funcionalidades Principais:

Se quiser testar apenas as funcionalidades de IA implementadas:

1. Acesse diretamente: http://localhost:3000/voice-recording
2. Calibre sua voz
3. Calibre seu rosto
4. Vá para: http://localhost:3000/dashboard
5. Clique em "INICIAR TESTE FAST"

## 🔧 Troubleshooting

### Erro: "Cannot find module"
```bash
cd frontend
npm install
```

### Erro: "Port 3000 already in use"
```bash
# Matar processo na porta 3000
kill -9 $(lsof -t -i:3000)

# Ou usar outra porta
PORT=3001 npm start
```

### Erro: "Port 8000 already in use"
```bash
# Matar processo na porta 8000
kill -9 $(lsof -t -i:8000)
```

### Backend não conecta com Groq API
- Verifique se `GROQ_API_KEY` está configurado
- Teste: `echo $GROQ_API_KEY`
- Se vazio, exporte novamente

### Câmera/Microfone não funcionam
- Certifique-se de estar usando **localhost** ou **HTTPS**
- Conceda permissões no navegador
- Chrome: chrome://settings/content
- Firefox: about:preferences#privacy

### MediaPipe não carrega
- Verifique sua conexão com internet (carrega do CDN)
- Limpe o cache do navegador
- Recarregue a página

## 📦 Dependências do Frontend

Se precisar reinstalar tudo:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

Principais dependências:
- react@18.2.0
- react-router-dom@6.20.0
- react-webcam@7.1.1

## 🔑 Onde conseguir as chaves API

### GROQ_API_KEY:
1. Acesse: https://console.groq.com
2. Crie uma conta
3. Gere uma API key
4. Copie e configure: `export GROQ_API_KEY="sua_chave"`

### HF_TOKEN:
1. Acesse: https://huggingface.co/settings/tokens
2. Faça login
3. Crie um novo token
4. Copie e configure: `export HF_TOKEN="seu_token"`

## 💡 Dicas

- Use **dois terminais separados** (um para backend, outro para frontend)
- O backend deve estar rodando **antes** de usar o frontend
- As calibrações são salvas no **localStorage** do navegador
- Limpar cache/localStorage vai resetar seus perfis

## 🎬 Estrutura do Projeto

```
AvisoVC/
├── aviso_vc/              # Backend Python/FastAPI
│   ├── api.py            # Endpoints
│   ├── service.py        # Lógica de calibração
│   └── transcription.py  # Groq/Whisper
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── pages/        # Páginas
│   │   ├── utils/        # Utilidades (API, Audio, Face)
│   │   └── contexts/     # Context API
│   └── public/           # Assets públicos
└── run_pipeline.py        # Script principal do backend
```

## ✅ Checklist de Funcionamento

Verifique se tudo está rodando:

- [ ] Backend respondendo em http://localhost:8000
- [ ] Frontend carregando em http://localhost:3000
- [ ] Console do backend sem erros
- [ ] Console do navegador sem erros
- [ ] Microfone com permissão
- [ ] Câmera com permissão
- [ ] Variáveis GROQ_API_KEY e HF_TOKEN configuradas

## 📞 Suporte

Se tudo mais falhar:
1. Verifique os logs do backend no terminal
2. Abra o Console do Navegador (F12) e veja erros
3. Verifique a aba Network para erros de API

---

**Pronto para começar! 🎉**
