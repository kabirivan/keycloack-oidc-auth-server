import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config.js';

// Importar rutas
import wellKnown from './routes/well-known.js';
import authorize from './routes/authorize.js';
import token from './routes/token.js';
import userinfo from './routes/userinfo.js';
import jwks from './routes/jwks.js';

// Crear aplicación Hono
const app = new Hono();

// Middleware global
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Ruta de salud
app.get('/', (c) => {
  return c.json({
    message: 'OIDC Identity Provider con Hono.js',
    version: config.version,
    buildDate: config.buildDate,
    environment: config.environment,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      discovery: '/.well-known/openid-configuration',
      authorize: '/authorize',
      token: '/token',
      userinfo: '/userinfo',
      jwks: '/jwks'
    },
    testUser: {
      email: config.testUser.email,
      // password: 'baLexI' // No mostrar en producción
    }
  });
});

// Endpoint específico para healthcheck
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: config.version,
    buildDate: config.buildDate,
    environment: config.environment
  });
});

// Endpoint de debug para verificar variables de entorno
app.get('/debug/env', (c) => {
  return c.json({
    SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Configurada' : '❌ No configurada',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada',
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    config_supabase_url: config.supabase.url,
    config_supabase_anon_key: config.supabase.anonKey ? '✅ Configurada' : '❌ No configurada',
    all_env_vars: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
    dotenv_loaded: process.env.DOTENV_LOADED || 'No detectado'
  });
});

// Endpoint de prueba para verificar conexión a Supabase
app.get('/debug/supabase', async (c) => {
  try {
    const { SupabaseService } = await import('./services/supabase.js');
    const user = await SupabaseService.getUserByEmail('xaguas@allient.io');
    
    if (user) {
      return c.json({
        status: 'success',
        message: 'Conexión a Supabase exitosa',
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      return c.json({
        status: 'error',
        message: 'Usuario no encontrado en Supabase'
      });
    }
  } catch (error) {
    return c.json({
      status: 'error',
      message: 'Error conectando a Supabase',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Registrar rutas
app.route('/', wellKnown);
app.route('/', authorize);
app.route('/', token);
app.route('/', userinfo);
app.route('/', jwks);

// Manejo de errores
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'internal_server_error',
    error_description: 'Error interno del servidor'
  }, 500);
});

// Iniciar servidor
console.log(`🚀 Servidor OIDC iniciando en puerto ${config.port}`);
console.log(`📋 Endpoints disponibles:`);
console.log(`   - Descubrimiento: http://localhost:${config.port}/.well-known/openid-configuration`);
console.log(`   - Autorización: http://localhost:${config.port}/authorize`);
console.log(`   - Token: http://localhost:${config.port}/token`);
console.log(`   - UserInfo: http://localhost:${config.port}/userinfo`);
console.log(`   - JWKS: http://localhost:${config.port}/jwks`);
console.log(`👤 Usuario de prueba: ${config.testUser.email}`);

// Iniciar servidor con serve
import { serve } from '@hono/node-server';

serve({
  fetch: app.fetch,
  port: config.port,
});
