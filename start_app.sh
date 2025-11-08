#!/bin/bash

# Script para iniciar o AvisaVC
# Frontend React + Backend FastAPI

echo "🚀 Iniciando AvisaVC..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$GROQ_API_KEY" ]; then
    echo -e "${RED}❌ GROQ_API_KEY não está configurada!${NC}"
    echo "Configure com: export GROQ_API_KEY=\"sua_chave\""
    echo "Obtenha em: https://console.groq.com"
    echo ""
    read -p "Deseja continuar sem GROQ_API_KEY? (a transcrição não funcionará) [s/N]: " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

if [ -z "$HF_TOKEN" ]; then
    echo -e "${RED}❌ HF_TOKEN não está configurada!${NC}"
    echo "Configure com: export HF_TOKEN=\"seu_token\""
    echo "Obtenha em: https://huggingface.co/settings/tokens"
    echo ""
    read -p "Deseja continuar sem HF_TOKEN? (algumas funcionalidades podem não funcionar) [s/N]: " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

VENV_LOCAL="./venv_avisovc"
VENV_GLOBAL="/home/hugorteixeira/venv_avisovc"

# Verificar se o ambiente virtual existe (local ou global)
if [ -d "$VENV_LOCAL" ]; then
    VENV_PATH="$VENV_LOCAL"
elif [ -d "$VENV_GLOBAL" ]; then
    VENV_PATH="$VENV_GLOBAL"
else
    echo -e "${RED}❌ Ambiente virtual não encontrado!${NC}"
    echo "Crie com: python -m venv venv_avisovc"
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências do frontend...${NC}"
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✅ Dependências instaladas!${NC}"
    echo ""
fi

# Criar diretórios de log
mkdir -p logs

echo -e "${BLUE}🔧 Configuração:${NC}"
echo "  Backend: http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  Logs: logs/"
echo ""

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Parando serviços...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Serviços parados!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar Backend
echo -e "${BLUE}🐍 Iniciando Backend...${NC}"
source "$VENV_PATH/bin/activate"
python run_backend.py > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend iniciado (PID: $BACKEND_PID)${NC}"
echo "   Logs: logs/backend.log"
echo ""

# Aguardar backend iniciar
echo -e "${YELLOW}⏳ Aguardando backend inicializar...${NC}"

BACKEND_READY=false
for i in {1..15}; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend finalizou inesperadamente!${NC}"
        echo "Verifique os logs em: logs/backend.log"
        cat logs/backend.log
        exit 1
    fi

    if curl -sf http://localhost:8000/healthz > /dev/null 2>&1; then
        BACKEND_READY=true
        echo -e "${GREEN}✅ Backend respondendo!${NC}"
        break
    fi
    sleep 1
done

if [ "$BACKEND_READY" = false ]; then
    echo -e "${YELLOW}⚠️  Backend ainda não confirmou readiness (verifique logs)${NC}"
fi
echo ""

# Iniciar Frontend
echo -e "${BLUE}⚛️  Iniciando Frontend...${NC}"
cd frontend
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
echo "   Logs: logs/frontend.log"
echo ""

echo -e "${GREEN}🎉 AvisaVC está rodando!${NC}"
echo ""
echo -e "${BLUE}📱 Acesse: http://localhost:3000${NC}"
echo ""
echo "Logs em tempo real:"
echo "  Backend:  tail -f logs/backend.log"
echo "  Frontend: tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar os serviços${NC}"
echo ""

# Aguardar um pouco para garantir que tudo iniciou
sleep 5

# Abrir o navegador automaticamente (opcional)
if command -v xdg-open > /dev/null; then
    echo "🌐 Abrindo navegador..."
    xdg-open http://localhost:3000 2>/dev/null &
elif command -v open > /dev/null; then
    echo "🌐 Abrindo navegador..."
    open http://localhost:3000 2>/dev/null &
fi

# Manter o script rodando
wait
