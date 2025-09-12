import { Hono, Context, Next } from 'hono';
import { config } from '../config.js';
import { JWTService } from '../utils/jwt.js';

const userinfo = new Hono();

// Definir tipos para el contexto
interface TokenData {
  userId: string;
  clientId: string;
  scope: string;
}

// Middleware para verificar JWT
const verifyJWT = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ 
      error: 'invalid_token',
      error_description: 'Token de acceso requerido'
    }, 401);
  }

  const token = authHeader.substring(7); // Remover 'Bearer '
  
  // Verificar token usando el servicio JWT
  const tokenData = JWTService.validateAccessToken(token);
  
  if (!tokenData) {
    return c.json({ 
      error: 'invalid_token',
      error_description: 'Token de acceso inválido o expirado'
    }, 401);
  }

  // Agregar información del token al contexto
  c.set('tokenData', tokenData as TokenData);
  c.set('userId', tokenData.userId);
  
  await next();
};

// Endpoint GET /userinfo - Retorna información del usuario
userinfo.get('/userinfo', verifyJWT, async (c: Context) => {
  const tokenData = c.get('tokenData') as TokenData;
  const userId = c.get('userId') as string;

  // Verificar que el scope incluya openid
  if (!tokenData.scope.includes('openid')) {
    return c.json({ 
      error: 'insufficient_scope',
      error_description: 'El scope openid es requerido'
    }, 403);
  }

  try {
    // Obtener información del usuario desde Supabase
    const { ExternalAuthService } = await import('../services/externalAuth.js');
    const supabaseUser = await ExternalAuthService.getUserFromSupabase('xaguas@allient.io');
    
    // Usar datos reales del usuario si están disponibles, sino usar testUser
    const userData = supabaseUser ? supabaseUser.oidcUser : config.testUser;

    // Retornar información del usuario basada en el scope
    const userInfo: any = {
      sub: tokenData.userId
    };

    // Agregar claims según el scope
    if (tokenData.scope.includes('profile')) {
      userInfo.name = userData.name;
      userInfo.given_name = userData.given_name;
      userInfo.family_name = userData.family_name;
      userInfo.preferred_username = userData.preferred_username;
    }
    
    // Siempre incluir family_name si está disponible
    if (userData.family_name) {
      userInfo.family_name = userData.family_name;
    }

    if (tokenData.scope.includes('email')) {
      userInfo.email = userData.email;
      userInfo.email_verified = userData.email_verified;
    }

    return c.json(userInfo);
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error);
    
    // Fallback a testUser si hay error
    const userInfo: any = {
      sub: tokenData.userId
    };

    if (tokenData.scope.includes('profile')) {
      userInfo.name = config.testUser.name;
      userInfo.given_name = config.testUser.given_name;
      userInfo.family_name = config.testUser.family_name;
      userInfo.preferred_username = config.testUser.preferred_username;
    }
    
    // Siempre incluir family_name si está disponible
    if (config.testUser.family_name) {
      userInfo.family_name = config.testUser.family_name;
    }

    if (tokenData.scope.includes('email')) {
      userInfo.email = config.testUser.email;
      userInfo.email_verified = config.testUser.email_verified;
    }

    return c.json(userInfo);
  }
});

// Endpoint POST /userinfo - También soporta POST según especificación OIDC
userinfo.post('/userinfo', verifyJWT, (c: Context) => {
  // Reutilizar la misma lógica que GET
  return userinfo.fetch(new Request(c.req.url, {
    method: 'GET',
    headers: c.req.raw.headers
  }));
});

export default userinfo;
