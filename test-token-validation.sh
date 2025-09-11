#!/bin/bash

# Script para probar la validación de token independientemente
echo "🔍 Probando validación de token independiente"
echo "============================================="

# Configuración
TEST_EMAIL="hortiz@libelulasoft.com"
TEST_PASSWORD="baLexI"
LOGIN_URL="https://middleware-preproduccion.portalaig.com/frontend/web/index.php?r=aig-agil-auth/login"
VALIDATION_URL="https://middleware-preproduccion.portalaig.com/frontend/web/index.php?r=aig-agil-auth/validar-token"

echo "📧 Email: $TEST_EMAIL"
echo "🔑 Contraseña: $TEST_PASSWORD"
echo ""

echo "1️⃣ Obteniendo access token del endpoint de login..."
login_response=$(curl -s -X POST "$LOGIN_URL" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "Respuesta del login:"
echo "$login_response"
echo ""

# Extraer access token
access_token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$access_token" ]; then
    echo "❌ No se pudo obtener access token"
    exit 1
fi

echo "✅ Access token obtenido: ${access_token:0:50}..."
echo ""

echo "2️⃣ Validando access token..."
validation_url="${VALIDATION_URL}&token=${access_token}&correo=${TEST_EMAIL}"
validation_response=$(curl -s -X GET "$validation_url" \
    -H "Accept: application/json")

echo "Respuesta de validación:"
echo "$validation_response"
echo ""

# Verificar si el token es válido
if echo "$validation_response" | grep -q '"valido":true'; then
    echo "✅ Token validado exitosamente"
    echo "🎯 El flujo de validación funciona correctamente"
else
    echo "❌ Token no válido"
    echo "🔍 Respuesta de validación: $validation_response"
fi

echo ""
echo "🏁 Prueba de validación de token completada"
