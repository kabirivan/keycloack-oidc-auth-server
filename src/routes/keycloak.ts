import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { KeycloakService } from '../services/keycloakService';
import { TokenExchangeRequestSchema } from '../types';

const keycloakBridge = new Hono();
const keycloakService = KeycloakService.getInstance();

// Aplicar CORS
keycloakBridge.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * POST /api/bridge/token-exchange
 * Intercambia un token legacy por tokens OIDC de Keycloak
 */
keycloakBridge.post('/token-exchange', async (c) => {
  try {
    const body = await c.req.json();
    const { legacyToken } = TokenExchangeRequestSchema.parse(body);

    // Realizar token exchange
    const keycloakTokens = await keycloakService.exchangeLegacyToken(legacyToken);

    return c.json({
      success: true,
      message: 'Token exchange exitoso',
      data: {
        tokens: keycloakTokens,
        tokenType: 'Bearer',
        expiresIn: keycloakTokens.expires_in
      }
    }, 200);

  } catch (error) {
    console.error('Error en token exchange:', error);
    
    if (error instanceof Error) {
      if (error.message === 'KEYCLOAK_ERROR') {
        return c.json({
          success: false,
          message: 'Error en la comunicación con Keycloak',
          error: 'KEYCLOAK_ERROR'
        }, 502);
      }
    }

    return c.json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    }, 500);
  }
});

/**
 * POST /api/bridge/validate-keycloak-token
 * Valida un token de Keycloak
 */
keycloakBridge.post('/validate-keycloak-token', async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;

    if (!token) {
      return c.json({
        success: false,
        message: 'Token requerido',
        error: 'MISSING_TOKEN'
      }, 400);
    }

    // Validar token con Keycloak
    const tokenInfo = await keycloakService.validateKeycloakToken(token);

    if (!tokenInfo.active) {
      return c.json({
        success: false,
        message: 'Token inválido o expirado',
        error: 'TOKEN_INVALID'
      }, 401);
    }

    return c.json({
      success: true,
      message: 'Token válido',
      data: {
        tokenInfo,
        valid: true
      }
    }, 200);

  } catch (error) {
    console.error('Error validando token de Keycloak:', error);
    
    if (error instanceof Error) {
      if (error.message === 'KEYCLOAK_ERROR') {
        return c.json({
          success: false,
          message: 'Error en la comunicación con Keycloak',
          error: 'KEYCLOAK_ERROR'
        }, 502);
      }
    }

    return c.json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    }, 500);
  }
});

/**
 * GET /api/bridge/health
 * Verifica la salud de la conexión con Keycloak
 */
keycloakBridge.get('/health', async (c) => {
  try {
    // Intentar obtener un token de admin para verificar conectividad
    await keycloakService['getAdminToken']();

    return c.json({
      success: true,
      message: 'Conexión con Keycloak establecida',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    }, 200);

  } catch (error) {
    console.error('Error verificando salud de Keycloak:', error);
    
    return c.json({
      success: false,
      message: 'Error conectando con Keycloak',
      error: 'KEYCLOAK_CONNECTION_ERROR',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    }, 503);
  }
});

export default keycloakBridge;
