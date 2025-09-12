import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { config } from '../config.js';

// Crear la clave secreta para JWT
const secret = new TextEncoder().encode(config.jwtSecret);

// Almacenamiento en memoria para códigos de autorización
const authorizationCodes = new Map<string, {
  code: string;
  clientId: string;
  redirectUri: string;
  state?: string;
  scope: string;
  expiresAt: number;
  userId: string;
  userEmail?: string;
}>();

// Almacenamiento en memoria para tokens de acceso
const accessTokens = new Map<string, {
  token: string;
  userId: string;
  clientId: string;
  scope: string;
  expiresAt: number;
}>();

export class JWTService {
  // Generar JWT para ID Token
  static async generateIdToken(user: any, clientId: string, nonce?: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: config.oidc.issuer,
      sub: user.sub,
      aud: clientId,
      exp: now + 3600, // 1 hora
      iat: now,
      auth_time: now,
      nonce: nonce,
      name: user.name,
      given_name: user.given_name,
      family_name: user.family_name,
      email: user.email,
      email_verified: user.email_verified,
      preferred_username: user.preferred_username
    };

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);
  }

  // Generar JWT para Access Token
  static async generateAccessToken(user: any, clientId: string, scope: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: config.oidc.issuer,
      sub: user.sub,
      aud: clientId,
      exp: now + 3600, // 1 hora
      iat: now,
      scope: scope,
      client_id: clientId
    };

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);
  }

  // Verificar JWT
  static async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload;
    } catch (error) {
      console.error('Error verificando JWT:', error);
      return null;
    }
  }

  // Generar código de autorización
  static generateAuthorizationCode(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Almacenar código de autorización
  static storeAuthorizationCode(
    code: string, 
    clientId: string, 
    redirectUri: string, 
    state: string | undefined,
    scope: string,
    userId: string,
    userEmail?: string
  ): void {
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutos
    
    authorizationCodes.set(code, {
      code,
      clientId,
      redirectUri,
      state,
      scope,
      expiresAt,
      userId,
      userEmail
    });
  }

  // Validar y consumir código de autorización
  static validateAndConsumeAuthorizationCode(code: string): {
    clientId: string;
    redirectUri: string;
    state?: string;
    scope: string;
    userId: string;
    userEmail?: string;
  } | null {
    const authCode = authorizationCodes.get(code);
    
    if (!authCode) {
      return null;
    }
    
    if (Date.now() > authCode.expiresAt) {
      authorizationCodes.delete(code);
      return null;
    }
    
    // Consumir el código
    authorizationCodes.delete(code);
    
    return {
      clientId: authCode.clientId,
      redirectUri: authCode.redirectUri,
      state: authCode.state,
      scope: authCode.scope,
      userId: authCode.userId,
      userEmail: authCode.userEmail
    };
  }

  // Almacenar token de acceso
  static storeAccessToken(token: string, userId: string, clientId: string, scope: string): void {
    const expiresAt = Date.now() + (3600 * 1000); // 1 hora
    
    accessTokens.set(token, {
      token,
      userId,
      clientId,
      scope,
      expiresAt
    });
  }

  // Validar token de acceso
  static validateAccessToken(token: string): {
    userId: string;
    clientId: string;
    scope: string;
  } | null {
    const accessToken = accessTokens.get(token);
    
    if (!accessToken) {
      return null;
    }
    
    if (Date.now() > accessToken.expiresAt) {
      accessTokens.delete(token);
      return null;
    }
    
    return {
      userId: accessToken.userId,
      clientId: accessToken.clientId,
      scope: accessToken.scope
    };
  }
}
