import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { LegacyUser, LegacyTokenPayload, AuthErrorCodes } from '../types';

export class LegacyAuthService {
  private static instance: LegacyAuthService;
  
  public static getInstance(): LegacyAuthService {
    if (!LegacyAuthService.instance) {
      LegacyAuthService.instance = new LegacyAuthService();
    }
    return LegacyAuthService.instance;
  }

  /**
   * Simula la autenticación contra un sistema legacy
   * En producción, esto se conectaría a una base de datos real
   */
  async authenticateUser(email: string, password: string): Promise<LegacyUser> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verificar credenciales demo
    if (email !== config.legacyUser.email) {
      throw new Error(AuthErrorCodes.INVALID_CREDENTIALS);
    }
    
    // En producción, comparar con hash de la BD
    if (password !== config.legacyUser.password) {
      throw new Error(AuthErrorCodes.INVALID_CREDENTIALS);
    }
    
    return {
      id: 'legacy-user-123',
      email: config.legacyUser.email,
      name: config.legacyUser.name,
      roles: config.legacyUser.roles
    };
  }

  /**
   * Genera un JWT token para el usuario autenticado
   */
  generateLegacyToken(user: LegacyUser): string {
    const payload: LegacyTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
    };

    return jwt.sign(payload, config.jwtSecret, { algorithm: 'HS256' });
  }

  /**
   * Valida y decodifica un token legacy
   */
  validateLegacyToken(token: string): LegacyTokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as LegacyTokenPayload;
      
      // Verificar que el token no haya expirado
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new Error(AuthErrorCodes.TOKEN_EXPIRED);
      }
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(AuthErrorCodes.TOKEN_INVALID);
      }
      throw error;
    }
  }

  /**
   * Obtiene información del usuario desde el token
   */
  getUserFromToken(token: string): LegacyUser {
    const payload = this.validateLegacyToken(token);
    
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: payload.roles
    };
  }

  /**
   * Verifica si un token es válido (sin lanzar excepción)
   */
  isTokenValid(token: string): boolean {
    try {
      this.validateLegacyToken(token);
      return true;
    } catch {
      return false;
    }
  }
}
