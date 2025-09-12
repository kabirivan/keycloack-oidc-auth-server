#!/bin/bash

# Script para probar la visualización de versión en el formulario
echo "🧪 Probando visualización de versión en formulario de login"
echo "=========================================================="

# Configuración
BASE_URL="http://localhost:3000"

echo "📧 Probando endpoint principal..."
main_response=$(curl -s -X GET "$BASE_URL/")
echo "Respuesta del endpoint principal:"
echo "$main_response" | jq '.' 2>/dev/null || echo "$main_response"
echo ""

echo "🏥 Probando endpoint de health..."
health_response=$(curl -s -X GET "$BASE_URL/health")
echo "Respuesta del health check:"
echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
echo ""

echo "🔐 Probando formulario de login..."
auth_url="$BASE_URL/authorize?client_id=test-client&redirect_uri=http://localhost:8080/callback&response_type=code&scope=openid"
auth_response=$(curl -s -X GET "$auth_url")

echo "Verificando elementos del formulario:"

# Verificar que el formulario contiene la versión
if echo "$auth_response" | grep -q "v1.0.0"; then
    echo "✅ Versión encontrada en el formulario"
else
    echo "❌ Versión no encontrada en el formulario"
fi

# Verificar que contiene el environment
if echo "$auth_response" | grep -q "development"; then
    echo "✅ Environment encontrado en el formulario"
else
    echo "❌ Environment no encontrado en el formulario"
fi

# Verificar que contiene la fecha de build
if echo "$auth_response" | grep -q "Build:"; then
    echo "✅ Fecha de build encontrada en el formulario"
else
    echo "❌ Fecha de build no encontrada en el formulario"
fi

# Verificar que contiene los estilos CSS
if echo "$auth_response" | grep -q "version-info"; then
    echo "✅ Estilos CSS de versión encontrados"
else
    echo "❌ Estilos CSS de versión no encontrados"
fi

echo ""
echo "📊 Información de versión extraída del formulario:"
echo "$auth_response" | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1
echo "$auth_response" | grep -o 'environment[^>]*>[^<]*' | head -1
echo "$auth_response" | grep -o 'Build:[^<]*' | head -1

echo ""
echo "🏁 Prueba de visualización de versión completada"
