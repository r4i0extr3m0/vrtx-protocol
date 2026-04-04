#!/usr/bin/env bash
set -euo pipefail

# Setup rápido do VRTX Protocol (local)
# Uso:
#   bash scripts/setup_vrtx_protocol.sh
#
# Observação:
# - Este script NÃO cria Dev Build (EAS) pois isso exige login e decisão de plataforma.
# - Ele apenas instala dependências e prepara .env.

REPO_URL="https://github.com/r4i0extr3m0/vrtx-protocol.git"
DIR="vrtx-protocol"

if [ -d "$DIR" ]; then
  echo "Pasta '$DIR' já existe. Abortando para evitar sobrescrita."
  exit 1
fi

command -v git >/dev/null 2>&1 || { echo "git não encontrado"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm não encontrado. Instale com: npm i -g pnpm"; exit 1; }

echo "Clonando..."
git clone "$REPO_URL" "$DIR"
cd "$DIR"

echo "Instalando dependências..."
pnpm install

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "Criando .env a partir de .env.example..."
    cp .env.example .env
    echo "Edite o arquivo .env com suas credenciais (Supabase/IA/RevenueCat)."
  else
    echo "Aviso: .env.example não encontrado. Você precisará criar .env manualmente."
  fi
else
  echo ".env já existe. Mantendo."
fi

echo "OK. Próximo passo recomendado:"
echo "  npx expo start --dev-client"
