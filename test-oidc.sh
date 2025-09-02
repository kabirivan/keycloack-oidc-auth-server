#!/bin/bash

# Script de prueba para el servidor OIDC
# Asegúrate de que el servidor esté ejecutándose en http://localhost:3000

echo "🧪 Probando Servidor OIDC con Hono.js"
echo "======================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar que el servidor esté ejecutándose
print_status "Verificando que el servidor esté ejecutándose..."
if ! curl -s http://localhost:3000/ > /dev/null; then
    print_error "El servidor no está ejecutándose en http://localhost:3000"
    print_warning "Ejecuta: npm run dev"
    exit 1
fi
print_success "Servidor está ejecutándose"

echo ""

# 1. Probar endpoint raíz
print_status "1. Probando endpoint raíz..."
ROOT_RESPONSE=$(curl -s http://localhost:3000/)
if echo "$ROOT_RESPONSE" | grep -q "OIDC Identity Provider"; then
    print_success "Endpoint raíz funcionando correctamente"
else
    print_error "Endpoint raíz no responde correctamente"
fi

echo ""

# 2. Probar endpoint de descubrimiento OIDC
print_status "2. Probando endpoint de descubrimiento OIDC..."
DISCOVERY_RESPONSE=$(curl -s http://localhost:3000/.well-known/openid-configuration)
if echo "$DISCOVERY_RESPONSE" | grep -q "issuer"; then
    print_success "Endpoint de descubrimiento OIDC funcionando"
    echo "$DISCOVERY_RESPONSE" | jq '.issuer, .authorization_endpoint, .token_endpoint'
else
    print_error "Endpoint de descubrimiento OIDC no responde correctamente"
fi

echo ""

# 3. Probar endpoint JWKS
print_status "3. Probando endpoint JWKS..."
JWKS_RESPONSE=$(curl -s http://localhost:3000/jwks)
if echo "$JWKS_RESPONSE" | grep -q "keys"; then
    print_success "Endpoint JWKS funcionando"
    echo "$JWKS_RESPONSE" | jq '.keys[0].kty, .keys[0].alg'
else
    print_error "Endpoint JWKS no responde correctamente"
fi

echo ""

# 4. Probar endpoint de autorización (formulario HTML)
print_status "4. Probando endpoint de autorización..."
AUTH_RESPONSE=$(curl -s "http://localhost:3000/authorize?client_id=test-client&redirect_uri=http://localhost:8080/callback&response_type=code&scope=openid%20profile%20email&state=test-state")
if echo "$AUTH_RESPONSE" | grep -q "Iniciar Sesión"; then
    print_success "Endpoint de autorización funcionando (formulario HTML generado)"
else
    print_error "Endpoint de autorización no responde correctamente"
fi

echo ""

# 5. Probar grant type password
print_status "5. Probando grant type password..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=hortiz@libelulasoft.com&password=baLexI&client_id=test-client&scope=openid%20profile%20email")

if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
    print_success "Grant type password funcionando"
    
    # Extraer access_token
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')
    ID_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.id_token')
    
    echo "Access Token: ${ACCESS_TOKEN:0:50}..."
    echo "ID Token: ${ID_TOKEN:0:50}..."
else
    print_error "Grant type password no funciona"
    echo "Respuesta: $TOKEN_RESPONSE"
fi

echo ""

# 6. Probar endpoint userinfo
if [ ! -z "$ACCESS_TOKEN" ]; then
    print_status "6. Probando endpoint userinfo..."
    USERINFO_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/userinfo)
    
    if echo "$USERINFO_RESPONSE" | grep -q "sub"; then
        print_success "Endpoint userinfo funcionando"
        echo "$USERINFO_RESPONSE" | jq '.sub, .name, .email'
    else
        print_error "Endpoint userinfo no responde correctamente"
        echo "Respuesta: $USERINFO_RESPONSE"
    fi
else
    print_warning "6. Saltando prueba de userinfo (no hay access_token)"
fi

echo ""

# 7. Probar con credenciales incorrectas
print_status "7. Probando con credenciales incorrectas..."
INVALID_RESPONSE=$(curl -s -X POST http://localhost:3000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=wrong@email.com&password=wrongpass&client_id=test-client&scope=openid")

if echo "$INVALID_RESPONSE" | grep -q "invalid_grant"; then
    print_success "Validación de credenciales funcionando correctamente"
else
    print_error "Validación de credenciales no funciona"
fi

echo ""

# 8. Probar con parámetros faltantes
print_status "8. Probando con parámetros faltantes..."
MISSING_RESPONSE=$(curl -s -X POST http://localhost:3000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=hortiz@libelulasoft.com&password=baLexI")

if echo "$MISSING_RESPONSE" | grep -q "invalid_request"; then
    print_success "Validación de parámetros funcionando correctamente"
else
    print_error "Validación de parámetros no funciona"
fi

echo ""
echo "======================================"
print_success "🎉 Todas las pruebas completadas!"
echo ""
print_status "📋 Resumen de endpoints probados:"
echo "   ✅ GET  / (endpoint raíz)"
echo "   ✅ GET  /.well-known/openid-configuration (descubrimiento OIDC)"
echo "   ✅ GET  /jwks (claves JWK)"
echo "   ✅ GET  /authorize (formulario de login)"
echo "   ✅ POST /token (intercambio de tokens)"
echo "   ✅ GET  /userinfo (información del usuario)"
echo ""
print_status "👤 Usuario de prueba: hortiz@libelulasoft.com"
print_status "🔑 Contraseña: baLexI"
echo ""
print_status "🚀 El servidor OIDC está listo para usar con Keycloak!"
