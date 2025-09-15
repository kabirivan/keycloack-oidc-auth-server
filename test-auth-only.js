#!/usr/bin/env node

// Script para probar solo la autenticación externa
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Probando solo autenticación externa');
console.log('=====================================');

// Usuario a probar
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'hortiz@libelulasoft.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'baLexI';

console.log(`📧 Email: ${TEST_EMAIL}`);
console.log(`🔑 Contraseña: ${TEST_PASSWORD}`);
console.log('');

async function testExternalAuth() {
    try {
        console.log('1️⃣ Probando autenticación externa...');
        
        // Probar autenticación externa
        const loginUrl = process.env.EXTERNAL_AUTH_URL;
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
        
        console.log(`   Status: ${loginResponse.status} ${loginResponse.statusText}`);
        
        if (!loginResponse.ok) {
            console.error(`❌ Error en autenticación externa: ${loginResponse.status} ${loginResponse.statusText}`);
            const errorText = await loginResponse.text();
            console.error('   Respuesta:', errorText);
            return false;
        }
        
        const loginData = await loginResponse.json();
        console.log('   Respuesta:', JSON.stringify(loginData, null, 2));
        
        if (!loginData.transaccion || !loginData.accessToken) {
            console.error('❌ Respuesta de autenticación externa inválida:', loginData);
            return false;
        }
        
        console.log('✅ Autenticación externa exitosa');
        console.log(`   Access Token: ${loginData.accessToken.substring(0, 50)}...`);
        console.log('');
        
        console.log('2️⃣ Probando validación de token...');
        
        // Probar validación de token
        const validationUrl = `${process.env.EXTERNAL_TOKEN_VALIDATION_URL || 'https://middleware-preproduccion.portalaig.com/frontend/web/index.php?r=aig-agil-auth/validar-token'}&token=${encodeURIComponent(loginData.accessToken)}&correo=${encodeURIComponent(TEST_EMAIL)}`;
        const validationResponse = await fetch(validationUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log(`   Status: ${validationResponse.status} ${validationResponse.statusText}`);
        
        if (!validationResponse.ok) {
            console.error(`❌ Error en validación de token: ${validationResponse.status} ${validationResponse.statusText}`);
            const errorText = await validationResponse.text();
            console.error('   Respuesta:', errorText);
            return false;
        }
        
        const validationData = await validationResponse.json();
        console.log('   Respuesta:', JSON.stringify(validationData, null, 2));
        
        if (!validationData.transaccion || validationData.valido !== true) {
            console.error('❌ Token no válido según el endpoint externo:', validationData);
            return false;
        }
        
        console.log('✅ Token validado exitosamente');
        console.log('');
        
        console.log('🎯 RESUMEN:');
        console.log('   ✅ Autenticación externa exitosa');
        console.log('   ✅ Token validado correctamente');
        console.log('');
        console.log('🚀 El usuario puede autenticarse correctamente');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
        return false;
    }
}

// Ejecutar prueba
testExternalAuth().then(success => {
    if (success) {
        console.log('🏁 Prueba completada exitosamente');
        process.exit(0);
    } else {
        console.log('🏁 Prueba fallida');
        process.exit(1);
    }
});
