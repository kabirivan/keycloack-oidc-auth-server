import 'dotenv/config';
import { ExternalAuthService } from './dist/services/externalAuth.js';

console.log('🔍 Probando flujo OIDC completo');
console.log('=====================================');

// Verificar variables de entorno
console.log('📋 Variables de entorno:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada');

console.log('\n1️⃣ Probando autenticación externa...');
const authResult = await ExternalAuthService.validateAccessTokenExists('xaguas@allient.io', 'UbfIqm');

if (authResult) {
  console.log('✅ Autenticación externa exitosa');
  
  console.log('\n2️⃣ Probando consulta a Supabase...');
  const userResult = await ExternalAuthService.getUserFromSupabase('xaguas@allient.io');
  
  if (userResult) {
    console.log('✅ Usuario encontrado en Supabase:');
    console.log('   Nombre:', userResult.oidcUser.name);
    console.log('   Email:', userResult.oidcUser.email);
    console.log('   Rol:', userResult.oidcUser.role);
  } else {
    console.log('❌ Usuario no encontrado en Supabase');
  }
} else {
  console.log('❌ Autenticación externa fallida');
}

console.log('\n🏁 Prueba completada');
