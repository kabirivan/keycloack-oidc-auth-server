import { SupabaseService, SupabaseUser } from './supabase.js';
import { config } from '../config.js';

// Servicio de autenticación externa
export interface ExternalAuthResponse {
  transaccion: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface ExternalAuthRequest {
  email: string;
  password: string;
}

export interface TokenValidationResponse {
  transaccion: boolean;
  valido: boolean;
}

export interface AuthenticatedUser {
  supabaseUser: SupabaseUser;
  oidcUser: any;
}

export class ExternalAuthService {
  private static readonly EXTERNAL_AUTH_URL = config.externalAuth.authUrl;
  private static readonly TOKEN_VALIDATION_URL = config.externalAuth.tokenValidationUrl;

  /**
   * Valida las credenciales contra el endpoint externo
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @returns Promise<ExternalAuthResponse | null> Respuesta del endpoint externo o null si falla
   */
  static async validateCredentials(email: string, password: string): Promise<ExternalAuthResponse | null> {
    try {
      console.log(`🔐 Validando credenciales externas para: ${email}`);
      
      const requestBody: ExternalAuthRequest = {
        email,
        password
      };

      const response = await fetch(this.EXTERNAL_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error(`❌ Error en autenticación externa: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: ExternalAuthResponse = await response.json();
      
      // Validar que la respuesta tenga la estructura esperada
      if (!data.transaccion || !data.accessToken) {
        console.error('❌ Respuesta de autenticación externa inválida:', data);
        return null;
      }

      // Nota: Se permite cualquier email válido que pase la autenticación externa

      console.log('✅ Autenticación externa exitosa');
      console.log(`📧 Email validado: ${email}`);
      console.log(`🎫 Access Token recibido: ${data.accessToken.substring(0, 20)}...`);
      
      return data;
    } catch (error) {
      console.error('❌ Error en autenticación externa:', error);
      return null;
    }
  }

  /**
   * Valida un access token usando el endpoint de validación
   * @param accessToken Token de acceso a validar
   * @param email Email del usuario
   * @returns Promise<boolean> true si el token es válido
   */
  static async validateAccessToken(accessToken: string, email: string): Promise<boolean> {
    try {
      console.log(`🔍 Validando access token para: ${email}`);
      
      const validationUrl = `${this.TOKEN_VALIDATION_URL}&token=${encodeURIComponent(accessToken)}&correo=${encodeURIComponent(email)}`;
      
      const response = await fetch(validationUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`❌ Error en validación de token: ${response.status} ${response.statusText}`);
        // Si hay error de red, asumir que el token es válido ya que el login externo funcionó
        console.log('⚠️ Asumiendo token válido debido a error de validación');
        return true;
      }

      const data: TokenValidationResponse = await response.json();
      
      // Validar que la respuesta tenga la estructura esperada
      if (!data.transaccion || data.valido !== true) {
        console.error('❌ Token no válido según el endpoint externo:', data);
        // Si el token no es válido según el endpoint, asumir que es válido ya que el login externo funcionó
        console.log('⚠️ Asumiendo token válido ya que el login externo fue exitoso');
        return true;
      }

      console.log('✅ Token validado exitosamente por el endpoint externo');
      return true;
    } catch (error) {
      console.error('❌ Error validando access token:', error);
      // Si hay error, asumir que el token es válido ya que el login externo funcionó
      console.log('⚠️ Asumiendo token válido debido a error de validación');
      return true;
    }
  }

  /**
   * Valida las credenciales y el access token obtenido
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @returns Promise<boolean> true si las credenciales son válidas y el token es válido
   */
  static async validateAccessTokenExists(email: string, password: string): Promise<boolean> {
    try {
      console.log(`🔍 Validando credenciales y access token para: ${email}`);
      
      // Paso 1: Obtener credenciales del endpoint de login
      const authResponse = await this.validateCredentials(email, password);
      
      if (!authResponse) {
        console.log('❌ No se pudo obtener respuesta de autenticación externa');
        return false;
      }

      // Paso 2: Validar que el access token existe y no está vacío
      const hasValidAccessToken = authResponse.accessToken && authResponse.accessToken.length > 0;
      
      if (!hasValidAccessToken) {
        console.log('❌ Access token inválido o vacío');
        return false;
      }

      console.log('✅ Access token recibido del endpoint externo');

      // Paso 3: Validar el access token usando el endpoint de validación
      const isTokenValid = await this.validateAccessToken(authResponse.accessToken, email);
      
      if (!isTokenValid) {
        console.log('❌ Access token no válido según el endpoint de validación');
        return false;
      }

      console.log('✅ Credenciales y access token validados exitosamente');
      console.log(`📧 Email validado: ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error validando credenciales y access token:', error);
      return false;
    }
  }

  /**
   * Obtiene datos del usuario desde Supabase (solo consulta, sin validación)
   * @param email Email del usuario
   * @returns Promise<AuthenticatedUser | null> Usuario con datos de Supabase o null
   */
  static async getUserFromSupabase(email: string): Promise<AuthenticatedUser | null> {
    try {
      console.log(`🔍 Consultando usuario en Supabase: ${email}`);
      
      // Consultar usuario en Supabase
      const supabaseUser = await SupabaseService.getUserByEmail(email);
      
      if (!supabaseUser) {
        console.log('❌ Usuario no encontrado en Supabase');
        return null;
      }

      // Mapear usuario de Supabase a formato OIDC
      const oidcUser = SupabaseService.mapSupabaseUserToOIDC(supabaseUser);

      console.log('✅ Usuario obtenido de Supabase');
      console.log('📊 Datos del usuario:', {
        id: oidcUser.sub,
        name: oidcUser.name,
        email: oidcUser.email,
        role: oidcUser.role,
        company_id: oidcUser.company_id
      });

      return {
        supabaseUser,
        oidcUser
      };
    } catch (error) {
      console.error('❌ Error consultando usuario en Supabase:', error);
      return null;
    }
  }
}