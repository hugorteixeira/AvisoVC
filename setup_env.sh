#!/bin/bash
# Setup script for AvisoVC environment variables

echo "============================================================"
echo "AvisoVC Environment Setup"
echo "============================================================"
echo ""

# Check if HF_TOKEN is already set
if [ -z "$HF_TOKEN" ]; then
    echo "⚠️  HF_TOKEN not found in environment"
    echo ""
    echo "You need a Hugging Face token to use pyannote models."
    echo "1. Go to https://huggingface.co/settings/tokens"
    echo "2. Create a new token (read access)"
    echo "3. Accept terms at:"
    echo "   - https://huggingface.co/pyannote/segmentation"
    echo "   - https://huggingface.co/pyannote/voice-activity-detection"
    echo ""
    read -p "Enter your HF_TOKEN (or press Enter to skip): " token
    if [ ! -z "$token" ]; then
        export HF_TOKEN="$token"
        echo "✓ HF_TOKEN set for this session"
        echo "  To make it permanent, add to your ~/.bashrc:"
        echo "  export HF_TOKEN=\"$token\""
    fi
else
    echo "✓ HF_TOKEN already set: ${HF_TOKEN:0:10}..."
fi

echo ""

# Check if GROQ_API_KEY is already set
if [ -z "$GROQ_API_KEY" ]; then
    echo "⚠️  GROQ_API_KEY not found in environment"
    echo ""
    echo "You need a Groq API key for transcription."
    echo "1. Go to https://console.groq.com"
    echo "2. Create an account if needed"
    echo "3. Generate an API key at https://console.groq.com/keys"
    echo ""
    read -p "Enter your GROQ_API_KEY (or press Enter to skip): " apikey
    if [ ! -z "$apikey" ]; then
        export GROQ_API_KEY="$apikey"
        echo "✓ GROQ_API_KEY set for this session"
        echo "  To make it permanent, add to your ~/.bashrc:"
        echo "  export GROQ_API_KEY=\"$apikey\""
    fi
else
    echo "✓ GROQ_API_KEY already set: ${GROQ_API_KEY:0:10}..."
fi

echo ""
echo "============================================================"

if [ ! -z "$HF_TOKEN" ] && [ ! -z "$GROQ_API_KEY" ]; then
    echo "✅ All environment variables are set!"
    echo ""
    echo "You can now run:"
    echo "  python run_backend.py"
else
    echo "⚠️  Some environment variables are missing"
    echo "  Please set them before running the application"
fi

echo "============================================================"
