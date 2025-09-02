import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AuthFlowService } from '../services/authFlowService';
import { LoginRequestSchema } from '../types';

const authFlow = new Hono();
const authFlowService = AuthFlowService.getInstance();

// Aplicar CORS
authFlow.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * POST /api/auth/complete-flow
 * Flujo completo de autenticación end-to-end
 */
authFlow.post('/complete-flow', async (c) => {
  try {
    const body = await c.req.json();
    const credentials = LoginRequestSchema.parse(body);

    const result = await authFlowService.completeAuthFlow(credentials);

    // Determinar código de estado HTTP basado en el resultado
    let statusCode = 200;
    
    if (!result.success) {
      switch (result.error) {
        case 'INVALID_CREDENTIALS':
          statusCode = 401;
          break;
        case 'USER_NOT_FOUND_IN_SUPABASE':
          statusCode = 409; // Conflict - usuario no existe en Supabase
          break;
        case 'KEYCLOAK_ERROR':
        case 'SUPABASE_ERROR':
          statusCode = 502; // Bad Gateway - error en servicio externo
          break;
        default:
          statusCode = 500; // Internal Server Error
      }
    }

    return c.json(result, statusCode);

  } catch (error) {
    console.error('Error en flujo completo de autenticación:', error);
    
    // Error de validación de entrada
    if (error instanceof Error && error.name === 'ZodError') {
      return c.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: 'VALIDATION_ERROR',
        details: error.message
      }, 400);
    }

    return c.json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    }, 500);
  }
});

/**
 * POST /api/auth/validate-legacy
 * Valida solo las credenciales legacy (para testing)
 */
authFlow.post('/validate-legacy', async (c) => {
  try {
    const body = await c.req.json();
    const credentials = LoginRequestSchema.parse(body);

    const result = await authFlowService.validateLegacyCredentials(credentials);

    const statusCode = result.success ? 200 : 401;

    return c.json(result, statusCode);

  } catch (error) {
    console.error('Error validando credenciales legacy:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return c.json({
        success: false,
        message: 'Datos de entrada inválidos',
        error: 'VALIDATION_ERROR',
        details: error.message
      }, 400);
    }

    return c.json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    }, 500);
  }
});

/**
 * GET /api/auth/health
 * Verifica el estado de todos los servicios
 */
authFlow.get('/health', async (c) => {
  try {
    const healthStatus = await authFlowService.healthCheck();

    const statusCode = healthStatus.overall ? 200 : 503;

    return c.json({
      success: healthStatus.overall,
      message: healthStatus.overall ? 'Todos los servicios están operativos' : 'Algunos servicios no están disponibles',
      data: {
        services: healthStatus,
        timestamp: new Date().toISOString()
      }
    }, statusCode);

  } catch (error) {
    console.error('Error en health check:', error);
    
    return c.json({
      success: false,
      message: 'Error verificando estado de servicios',
      error: 'HEALTH_CHECK_ERROR',
      data: {
        timestamp: new Date().toISOString()
      }
    }, 503);
  }
});

/**
 * GET /api/auth/demo-credentials
 * Devuelve las credenciales de demo para testing
 */
authFlow.get('/demo-credentials', async (c) => {
  return c.json({
    success: true,
    message: 'Credenciales de demo',
    data: {
      email: 'xaguas@allient.io',
      password: 'mK9a5T6NhYfqWy',
      note: 'Estas credenciales son solo para testing. El usuario debe existir previamente en Supabase.'
    }
  }, 200);
});

export default authFlow;
