#!/usr/bin/env node

// Script para probar la librería oficial de Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Probando librería oficial de Supabase (sin autenticación)');
console.log('==========================================================');

// Configuración
const TEST_EMAIL = 'hortiz@libelulasoft.com';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

console.log(`📧 Email de prueba: ${TEST_EMAIL}`);
console.log(`🔗 URL de Supabase: ${SUPABASE_URL}`);
console.log('');

// Verificar configuración
if (SUPABASE_URL === 'https://your-project.supabase.co' || SUPABASE_ANON_KEY === 'your-anon-key') {
    console.log('⚠️  Configuración de Supabase no encontrada');
    console.log('   Configura las variables de entorno:');
    console.log('   export SUPABASE_URL=https://tu-proyecto.supabase.co');
    console.log('   export SUPABASE_ANON_KEY=tu-anon-key');
    console.log('');
    console.log('   O crea un archivo .env con:');
    console.log('   SUPABASE_URL=https://tu-proyecto.supabase.co');
    console.log('   SUPABASE_ANON_KEY=tu-anon-key');
    console.log('');
    process.exit(1);
}

async function testSupabaseLibrary() {
    try {
        console.log('1️⃣ Creando cliente de Supabase (sin autenticación)...');
        
        // Crear cliente de Supabase sin autenticación
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                // Deshabilitar autenticación automática
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        });
        
        console.log('✅ Cliente de Supabase creado');
        console.log('');
        
        console.log('2️⃣ Consultando usuario en Supabase (consulta directa)...');
        
        // Consultar usuario usando la librería oficial (sin autenticación)
        const { data, error } = await supabase
            .from('user')
            .select('*')
            .eq('email', TEST_EMAIL)
            .eq('enabled', true)
            .single();
        
        if (error) {
            console.error('❌ Error consultando usuario en Supabase:', error);
            return false;
        }
        
        if (!data) {
            console.log(`❌ Usuario no encontrado en Supabase: ${TEST_EMAIL}`);
            return false;
        }
        
        console.log('✅ Usuario encontrado en Supabase');
        console.log('');
        
        console.log('3️⃣ Información del usuario:');
        console.log(`   ID: ${data.id}`);
        console.log(`   Nombre: ${data.full_name}`);
        console.log(`   Email: ${data.email}`);
        console.log(`   Rol: ${data.role}`);
        console.log(`   Habilitado: ${data.enabled}`);
        console.log(`   Compañía ID: ${data.company_id || 'N/A'}`);
        console.log(`   Creado: ${data.created_at || 'N/A'}`);
        console.log(`   Actualizado: ${data.updated_at || 'N/A'}`);
        console.log('');
        
        console.log('4️⃣ Mapeo a formato OIDC:');
        const oidcUser = {
            sub: data.id,
            email: data.email,
            email_verified: true,
            name: data.full_name,
            given_name: data.full_name.split(' ')[0] || data.full_name,
            family_name: data.full_name.split(' ').slice(1).join(' ') || '',
            preferred_username: data.email.split('@')[0],
            role: data.role,
            company_id: data.company_id,
            enabled: data.enabled,
            created_at: data.created_at,
            updated_at: data.updated_at
        };
        
        console.log('   Usuario OIDC:', JSON.stringify(oidcUser, null, 2));
        console.log('');
        
        console.log('✅ Prueba de librería oficial de Supabase exitosa (sin autenticación)');
        console.log('🎯 El servicio puede consultar la tabla user usando la librería oficial sin autenticación');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en prueba de Supabase:', error);
        return false;
    }
}

// Ejecutar prueba
testSupabaseLibrary().then(success => {
    if (success) {
        console.log('');
        console.log('🏁 Prueba completada exitosamente');
        process.exit(0);
    } else {
        console.log('');
        console.log('🏁 Prueba fallida');
        process.exit(1);
    }
});
