import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { LegacyAuthService } from '../services/legacyAuth';
import { LoginRequestSchema, TokenValidationSchema } from '../types';

const legacyAuth = new Hono();
const legacyAuthService = LegacyAuthService.getInstance();

// Aplicar CORS
legacyAuth.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * POST /api/legacy/login
 * Autentica un usuario con credenciales legacy
 */
legacyAuth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = LoginRequestSchema.parse(body);

    // Autenticar usuario
    const user = await legacyAuthService.authenticateUser(email, password);
    
    // Generar token legacy
    const token = legacyAuthService.generateLegacyToken(user);

    return c.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles
        },
        token,
        expiresIn: 3600 // 1 hora
      }
    }, 200);

  } catch (error) {
    console.error('Error en login legacy:', error);
    
    if (error instanceof Error) {
      if (error.message === 'INVALID_CREDENTIALS') {
        return c.json({
          success: false,
          message: 'Credenciales inválidas',
          error: 'INVALID_CREDENTIALS'
        }, 401);
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
 * GET /api/legacy/validate
 * Valida un token legacy
 */
legacyAuth.get('/validate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        message: 'Token de autorización requerido',
        error: 'MISSING_TOKEN'
      }, 401);
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    
    // Validar token
    const user = legacyAuthService.getUserFromToken(token);

    return c.json({
      success: true,
      message: 'Token válido',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles
        },
        valid: true
      }
    }, 200);

  } catch (error) {
    console.error('Error validando token legacy:', error);
    
    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXPIRED') {
        return c.json({
          success: false,
          message: 'Token expirado',
          error: 'TOKEN_EXPIRED'
        }, 401);
      }
      
      if (error.message === 'TOKEN_INVALID') {
        return c.json({
          success: false,
          message: 'Token inválido',
          error: 'TOKEN_INVALID'
        }, 401);
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
 * POST /api/legacy/validate-token
 * Endpoint alternativo para validar token via POST body
 */
legacyAuth.post('/validate-token', async (c) => {
  try {
    const body = await c.req.json();
    const { token } = TokenValidationSchema.parse(body);
    
    // Validar token
    const user = legacyAuthService.getUserFromToken(token);

    return c.json({
      success: true,
      message: 'Token válido',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles
        },
        valid: true
      }
    }, 200);

  } catch (error) {
    console.error('Error validando token legacy:', error);
    
    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXPIRED') {
        return c.json({
          success: false,
          message: 'Token expirado',
          error: 'TOKEN_EXPIRED'
        }, 401);
      }
      
      if (error.message === 'TOKEN_INVALID') {
        return c.json({
          success: false,
          message: 'Token inválido',
          error: 'TOKEN_INVALID'
        }, 401);
      }
    }

    return c.json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    }, 500);
  }
});

export default legacyAuth;
