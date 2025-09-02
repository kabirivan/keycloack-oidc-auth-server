import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SupabaseService } from '../services/supabaseService';
import { AuthErrorCodes } from '../types';

const supabaseAuth = new Hono();
const supabaseService = SupabaseService.getInstance();

// Aplicar CORS
supabaseAuth.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * POST /api/supabase/check-user
 * Verifica si un usuario existe en Supabase
 */
supabaseAuth.post('/check-user', async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({
        success: false,
        message: 'Email requerido',
        error: 'MISSING_EMAIL'
      }, 400);
    }

    const userExists = await supabaseService.userExists(email);

    return c.json({
      success: true,
      message: userExists ? 'Usuario encontrado' : 'Usuario no encontrado',
      data: {
        exists: userExists,
        email
      }
    }, 200);

  } catch (error) {
    console.error('Error verificando usuario en Supabase:', error);
    
    if (error instanceof Error) {
      if (error.message === AuthErrorCodes.SUPABASE_ERROR) {
        return c.json({
          success: false,
          message: 'Error en la comunicación con Supabase',
          error: 'SUPABASE_ERROR'
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
 * POST /api/supabase/create-session
 * Crea una sesión en Supabase para un usuario existente
 */
supabaseAuth.post('/create-session', async (c) => {
  try {
    const body = await c.req.json();
    const { idToken, email } = body;

    if (!idToken || !email) {
      return c.json({
        success: false,
        message: 'ID Token y email requeridos',
        error: 'MISSING_PARAMETERS'
      }, 400);
    }

    const sessionData = await supabaseService.createSessionWithIdToken(idToken, email);

    return c.json({
      success: true,
      message: 'Sesión creada exitosamente',
      data: {
        session: sessionData
      }
    }, 200);

  } catch (error) {
    console.error('Error creando sesión en Supabase:', error);
    
    if (error instanceof Error) {
      if (error.message === AuthErrorCodes.USER_NOT_FOUND_IN_SUPABASE) {
        return c.json({
          success: false,
          message: 'Usuario no encontrado en Supabase',
          error: 'USER_NOT_FOUND_IN_SUPABASE'
        }, 409);
      }
      
      if (error.message === AuthErrorCodes.SUPABASE_ERROR) {
        return c.json({
          success: false,
          message: 'Error en la comunicación con Supabase',
          error: 'SUPABASE_ERROR'
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
 * POST /api/supabase/validate-session
 * Valida una sesión de Supabase
 */
supabaseAuth.post('/validate-session', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionToken } = body;

    if (!sessionToken) {
      return c.json({
        success: false,
        message: 'Token de sesión requerido',
        error: 'MISSING_SESSION_TOKEN'
      }, 400);
    }

    const sessionData = await supabaseService.validateSession(sessionToken);

    return c.json({
      success: true,
      message: 'Sesión válida',
      data: {
        session: sessionData
      }
    }, 200);

  } catch (error) {
    console.error('Error validando sesión de Supabase:', error);
    
    if (error instanceof Error) {
      if (error.message === AuthErrorCodes.SUPABASE_ERROR) {
        return c.json({
          success: false,
          message: 'Error en la comunicación con Supabase',
          error: 'SUPABASE_ERROR'
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
 * GET /api/supabase/health
 * Verifica la salud de la conexión con Supabase
 */
supabaseAuth.get('/health', async (c) => {
  try {
    const isHealthy = await supabaseService.healthCheck();

    if (isHealthy) {
      return c.json({
        success: true,
        message: 'Conexión con Supabase establecida',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString()
        }
      }, 200);
    } else {
      return c.json({
        success: false,
        message: 'Error conectando con Supabase',
        error: 'SUPABASE_CONNECTION_ERROR',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      }, 503);
    }

  } catch (error) {
    console.error('Error verificando salud de Supabase:', error);
    
    return c.json({
      success: false,
      message: 'Error verificando salud de Supabase',
      error: 'HEALTH_CHECK_ERROR',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    }, 503);
  }
});

export default supabaseAuth;
