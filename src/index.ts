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
    version: '1.0.0',
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
