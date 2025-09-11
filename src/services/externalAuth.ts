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

export class ExternalAuthService {
  private static readonly EXTERNAL_AUTH_URL = 'https://middleware-preproduccion.portalaig.com/frontend/web/index.php?r=aig-agil-auth/login';
  private static readonly TOKEN_VALIDATION_URL = 'https://middleware-preproduccion.portalaig.com/frontend/web/index.php?r=aig-agil-auth/validar-token';
  private static readonly TEST_USER_EMAIL = 'hortiz@libelulasoft.com';

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

      // Validar que el email coincida con el usuario de prueba
      if (email !== this.TEST_USER_EMAIL) {
        console.error(`❌ Email no coincide con usuario de prueba: ${email} !== ${this.TEST_USER_EMAIL}`);
        return null;
      }

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
        return false;
      }

      const data: TokenValidationResponse = await response.json();
      
      // Validar que la respuesta tenga la estructura esperada
      if (!data.transaccion || data.valido !== true) {
        console.error('❌ Token no válido según el endpoint externo:', data);
        return false;
      }

      console.log('✅ Token validado exitosamente por el endpoint externo');
      return true;
    } catch (error) {
      console.error('❌ Error validando access token:', error);
      return false;
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
}