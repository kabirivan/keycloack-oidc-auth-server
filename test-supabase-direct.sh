#!/bin/bash

# Script para probar consulta directa a Supabase
echo "🔍 Probando consulta directa a Supabase"
echo "======================================"

# Configuración
TEST_EMAIL="hortiz@libelulasoft.com"
SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key}"

echo "📧 Email de prueba: $TEST_EMAIL"
echo "🔗 URL de Supabase: $SUPABASE_URL"
echo ""

# Función para hacer consulta directa a Supabase
test_supabase_query() {
    local email=$1
    local url=$2
    local key=$3
    
    echo "1️⃣ Haciendo consulta directa a Supabase..."
    
    # Construir URL de consulta
    local query_url="${url}/rest/v1/user?email=eq.${email}&enabled=eq.true&select=*"
    
    echo "🔗 URL de consulta: $query_url"
    echo ""
    
    # Hacer la consulta
    local response=$(curl -s -X GET "$query_url" \
        -H "apikey: $key" \
        -H "Authorization: Bearer $key" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json")
    
    echo "📊 Respuesta de Supabase:"
    echo "$response"
    echo ""
    
    # Verificar si se encontró el usuario
    if echo "$response" | grep -q '"email"'; then
        echo "✅ Usuario encontrado en Supabase"
        
        # Extraer información del usuario
        local user_id=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        local full_name=$(echo "$response" | grep -o '"full_name":"[^"]*"' | cut -d'"' -f4)
        local role=$(echo "$response" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
        
        echo "👤 Información del usuario:"
        echo "   ID: $user_id"
        echo "   Nombre: $full_name"
        echo "   Email: $email"
        echo "   Rol: $role"
        
        return 0
    else
        echo "❌ Usuario no encontrado en Supabase"
        return 1
    fi
}

# Verificar configuración
if [ "$SUPABASE_URL" = "https://your-project.supabase.co" ] || [ "$SUPABASE_ANON_KEY" = "your-anon-key" ]; then
    echo "⚠️  Configuración de Supabase no encontrada"
    echo "   Configura las variables de entorno:"
    echo "   export SUPABASE_URL=https://tu-proyecto.supabase.co"
    echo "   export SUPABASE_ANON_KEY=tu-anon-key"
    echo ""
    echo "   O crea un archivo .env con:"
    echo "   SUPABASE_URL=https://tu-proyecto.supabase.co"
    echo "   SUPABASE_ANON_KEY=tu-anon-key"
    echo ""
    exit 1
fi

# Ejecutar prueba
test_supabase_query "$TEST_EMAIL" "$SUPABASE_URL" "$SUPABASE_ANON_KEY"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Prueba de consulta directa a Supabase exitosa"
    echo "🎯 El servicio puede consultar la tabla user directamente"
else
    echo ""
    echo "❌ Prueba de consulta directa a Supabase fallida"
    echo "🔍 Verifica la configuración y las políticas RLS"
fi

echo ""
echo "🏁 Prueba completada"
