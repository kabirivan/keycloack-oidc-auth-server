#!/bin/bash

# Script para desplegar en Railway
echo "🚀 Desplegando OIDC Provider en Railway"
echo "======================================"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[PASO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[ÉXITO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ADVERTENCIA]${NC} $1"
}

# Verificar que Git esté inicializado
if [ ! -d ".git" ]; then
    print_step "Inicializando Git..."
    git init
    git add .
    git commit -m "Initial commit: OIDC Provider with Hono.js"
    print_success "Git inicializado"
else
    print_success "Git ya está inicializado"
fi

# Verificar si hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    print_step "Commitando cambios..."
    git add .
    git commit -m "Update: Prepare for Railway deployment"
    print_success "Cambios commiteados"
fi

# Verificar si hay un remote de GitHub
if ! git remote get-url origin > /dev/null 2>&1; then
    print_warning "No hay remote de GitHub configurado"
    echo "Por favor, crea un repositorio en GitHub y ejecuta:"
    echo "git remote add origin https://github.com/TU-USUARIO/keycloak-oidc-auth-server.git"
    echo "git push -u origin main"
    exit 1
fi

# Hacer push a GitHub
print_step "Subiendo código a GitHub..."
git push origin main
print_success "Código subido a GitHub"

echo ""
echo "======================================"
print_success "🎉 Código listo para Railway!"
echo ""
print_step "Próximos pasos:"
echo "1. Ve a https://railway.app"
echo "2. Haz clic en 'New Project'"
echo "3. Selecciona 'Deploy from GitHub repo'"
echo "4. Elige tu repositorio"
echo "5. Railway desplegará automáticamente"
echo ""
print_step "Una vez desplegado, usa estas URLs en Keycloak:"
echo "• Discovery: https://tu-proyecto.railway.app/.well-known/openid-configuration"
echo "• Authorization: https://tu-proyecto.railway.app/authorize"
echo "• Token: https://tu-proyecto.railway.app/token"
echo "• UserInfo: https://tu-proyecto.railway.app/userinfo"
echo ""
print_warning "Recuerda: Railway free tier se duerme después de 5 minutos de inactividad"
