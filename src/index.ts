import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config, validateConfig } from './config';

// Importar rutas
import legacyRoutes from './routes/legacy';
import keycloakRoutes from './routes/keycloak';
import supabaseRoutes from './routes/supabase';
import authRoutes from './routes/auth';

// Crear aplicación Hono
const app = new Hono();

// Configurar CORS global
app.use('*', cors({
  origin: config.corsOrigin,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware de logging
app.use('*', async (c, next) => {
  const start = Date.now();
  console.log(`${c.req.method} ${c.req.url} - ${new Date().toISOString()}`);
  
  await next();
  
  const duration = Date.now() - start;
  console.log(`${c.req.method} ${c.req.url} - ${c.res.status} - ${duration}ms`);
});

// Middleware de manejo de errores
app.onError((err, c) => {
  console.error('Error no manejado:', err);
  
  return c.json({
    success: false,
    message: 'Error interno del servidor',
    error: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  }, 500);
});

// Ruta de salud general
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Keycloak OIDC Auth Server - Demo de autenticación bridge',
    version: '1.0.0',
    endpoints: {
      legacy: '/api/legacy',
      keycloak: '/api/bridge',
      supabase: '/api/supabase',
      auth: '/api/auth'
    },
    timestamp: new Date().toISOString()
  });
});

// Ruta de salud del servidor
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Servidor operativo',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Registrar rutas
app.route('/api/legacy', legacyRoutes);
app.route('/api/bridge', keycloakRoutes);
app.route('/api/supabase', supabaseRoutes);
app.route('/api/auth', authRoutes);

// Ruta 404
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Endpoint no encontrado',
    error: 'NOT_FOUND',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/legacy/login',
      'GET /api/legacy/validate',
      'POST /api/bridge/token-exchange',
      'GET /api/bridge/health',
      'POST /api/supabase/check-user',
      'POST /api/supabase/create-session',
      'GET /api/supabase/health',
      'POST /api/auth/complete-flow',
      'GET /api/auth/health',
      'GET /api/auth/demo-credentials'
    ]
  }, 404);
});

// Función para iniciar el servidor
async function startServer() {
  try {
    // Validar configuración
    validateConfig();
    console.log('✓ Configuración validada');

    // Iniciar servidor
    const port = config.port;
    
    console.log('🚀 Iniciando Keycloak OIDC Auth Server...');
    console.log(`📡 Servidor corriendo en puerto ${port}`);
    console.log(`🌐 URL: http://localhost:${port}`);
    console.log('');
    console.log('📋 Endpoints disponibles:');
    console.log('  GET  /                    - Información del servidor');
    console.log('  GET  /health              - Salud del servidor');
    console.log('  POST /api/legacy/login    - Login en sistema legacy');
    console.log('  GET  /api/legacy/validate - Validar token legacy');
    console.log('  POST /api/bridge/token-exchange - Token exchange con Keycloak');
    console.log('  GET  /api/bridge/health   - Salud de Keycloak');
    console.log('  POST /api/supabase/check-user - Verificar usuario en Supabase');
    console.log('  POST /api/supabase/create-session - Crear sesión en Supabase');
    console.log('  GET  /api/supabase/health - Salud de Supabase');
    console.log('  POST /api/auth/complete-flow - Flujo completo end-to-end');
    console.log('  GET  /api/auth/health     - Salud de todos los servicios');
    console.log('  GET  /api/auth/demo-credentials - Credenciales de demo');
    console.log('');
    console.log('🔑 Credenciales de demo:');
    console.log('  Email: xaguas@allient.io');
    console.log('  Password: mK9a5T6NhYfqWy');
    console.log('');
    console.log('⚠️  IMPORTANTE: El usuario debe existir previamente en Supabase');
    console.log('   Si no existe, el flujo retornará USER_NOT_FOUND_IN_SUPABASE');

    // Iniciar servidor
    const server = Bun.serve({
      port,
      fetch: app.fetch,
    });

    console.log(`✅ Servidor iniciado exitosamente en puerto ${port}`);

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
startServer();

export default app;
