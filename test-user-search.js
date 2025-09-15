#!/usr/bin/env node

// Script para probar la búsqueda de usuario específico
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Probando búsqueda de usuario específico');
console.log('==========================================');

// Usuario a probar
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'hortiz@libelulasoft.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'baLexI';

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

console.log(`📧 Email a buscar: ${TEST_EMAIL}`);
console.log(`🔗 URL de Supabase: ${SUPABASE_URL}`);
console.log('');

// Verificar configuración
if (SUPABASE_URL === 'https://your-project.supabase.co' || SUPABASE_ANON_KEY === 'your-anon-key') {
    console.log('⚠️  Configuración de Supabase no encontrada');
    console.log('   Configura las variables de entorno:');
    console.log('   export SUPABASE_URL=https://tu-proyecto.supabase.co');
    console.log('   export SUPABASE_ANON_KEY=tu-anon-key');
    console.log('');
    process.exit(1);
}

async function testUserSearch() {
    try {
        console.log('1️⃣ Creando cliente de Supabase...');
        
        // Crear cliente de Supabase sin autenticación
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        });
        
        console.log('✅ Cliente de Supabase creado');
        console.log('');
        
        console.log('2️⃣ Buscando usuario en Supabase...');
        
        // Buscar usuario por email
        const { data, error } = await supabase
            .from('user')
            .select('*')
            .eq('email', TEST_EMAIL)
            .single();
        
        if (error) {
            console.error('❌ Error buscando usuario en Supabase:');
            console.error('   Código:', error.code);
            console.error('   Mensaje:', error.message);
            console.error('   Detalles:', error.details);
            console.error('   Hint:', error.hint);
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
        console.log(`   Nombre completo: ${data.full_name}`);
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
        
        console.log('   Usuario OIDC mapeado:');
        console.log(JSON.stringify(oidcUser, null, 2));
        console.log('');
        
        console.log('5️⃣ Probando autenticación externa...');
        
        // Probar autenticación externa
        const loginUrl = process.env.EXTERNAL_AUTH_URL || 'https://middleware-preproduccion.portalaig.com/frontend/web/index.php?r=aig-agil-auth/login';
        const loginResponse = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        });
        
        if (!loginResponse.ok) {
            console.error(`❌ Error en autenticación externa: ${loginResponse.status} ${loginResponse.statusText}`);
            return false;
        }
        
        const loginData = await loginResponse.json();
        
        if (!loginData.transaccion || !loginData.accessToken) {
            console.error('❌ Respuesta de autenticación externa inválida:', loginData);
            return false;
        }
        
        console.log('✅ Autenticación externa exitosa');
        console.log(`   Access Token: ${loginData.accessToken.substring(0, 50)}...`);
        console.log('');
        
        console.log('6️⃣ Probando validación de token...');
        
        // Probar validación de token
        const validationUrl = `${process.env.EXTERNAL_TOKEN_VALIDATION_URL || 'https://middleware-preproduccion.portalaig.com/frontend/web/index.php?r=aig-agil-auth/validar-token'}&token=${encodeURIComponent(loginData.accessToken)}&correo=${encodeURIComponent(TEST_EMAIL)}`;
        const validationResponse = await fetch(validationUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!validationResponse.ok) {
            console.error(`❌ Error en validación de token: ${validationResponse.status} ${validationResponse.statusText}`);
            return false;
        }
        
        const validationData = await validationResponse.json();
        
        if (!validationData.transaccion || validationData.valido !== true) {
            console.error('❌ Token no válido según el endpoint externo:', validationData);
            return false;
        }
        
        console.log('✅ Token validado exitosamente');
        console.log('');
        
        console.log('🎯 RESUMEN:');
        console.log('   ✅ Usuario encontrado en Supabase');
        console.log('   ✅ Autenticación externa exitosa');
        console.log('   ✅ Token validado correctamente');
        console.log('   ✅ Datos mapeados a formato OIDC');
        console.log('');
        console.log('🚀 El flujo completo debería funcionar correctamente');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
        return false;
    }
}

// Ejecutar prueba
testUserSearch().then(success => {
    if (success) {
        console.log('🏁 Prueba completada exitosamente');
        process.exit(0);
    } else {
        console.log('🏁 Prueba fallida');
        process.exit(1);
    }
});
