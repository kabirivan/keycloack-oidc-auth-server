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

export class ExternalAuthService {
  private static readonly EXTERNAL_AUTH_URL = 'https://middleware-preproduccion.portalaig.com/frontend/web/index.php?r=aig-agil-auth/login';
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
   * Valida solo que el endpoint externo devuelva un access token
   * Sin hacer nada con el token, solo verificar que existe
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @returns Promise<boolean> true si el endpoint devuelve un access token válido
   */
  static async validateAccessTokenExists(email: string, password: string): Promise<boolean> {
    try {
      console.log(`🔍 Validando existencia de access token para: ${email}`);
      
      const authResponse = await this.validateCredentials(email, password);
      
      if (!authResponse) {
        console.log('❌ No se pudo obtener respuesta de autenticación externa');
        return false;
      }

      // Solo validar que el access token existe y no está vacío
      const hasValidAccessToken = authResponse.accessToken && authResponse.accessToken.length > 0;
      
      if (hasValidAccessToken) {
        console.log('✅ Access token válido recibido del endpoint externo');
        console.log(`📧 Email validado: ${email}`);
        return true;
      } else {
        console.log('❌ Access token inválido o vacío');
        return false;
      }
    } catch (error) {
      console.error('❌ Error validando access token:', error);
      return false;
    }
  }
}