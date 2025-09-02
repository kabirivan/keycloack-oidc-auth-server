import { LegacyAuthService } from './legacyAuth';
import { KeycloakService } from './keycloakService';
import { SupabaseService } from './supabaseService';
import { AuthFlowResponse, AuthErrorCodes, LoginRequest } from '../types';

export class AuthFlowService {
  private static instance: AuthFlowService;
  private legacyAuth: LegacyAuthService;
  private keycloakService: KeycloakService;
  private supabaseService: SupabaseService;

  public static getInstance(): AuthFlowService {
    if (!AuthFlowService.instance) {
      AuthFlowService.instance = new AuthFlowService();
    }
    return AuthFlowService.instance;
  }

  constructor() {
    this.legacyAuth = LegacyAuthService.getInstance();
    this.keycloakService = KeycloakService.getInstance();
    this.supabaseService = SupabaseService.getInstance();
  }

  /**
   * Flujo completo de autenticación end-to-end:
   * 1. Login en legacy → 2. Token exchange en Keycloak → 3. Verificar usuario en Supabase → 4. Crear sesión
   */
  async completeAuthFlow(credentials: LoginRequest): Promise<AuthFlowResponse> {
    try {
      console.log('Iniciando flujo completo de autenticación...');

      // Paso 1: Autenticar en sistema legacy
      console.log('Paso 1: Autenticando en sistema legacy...');
      const legacyUser = await this.legacyAuth.authenticateUser(
        credentials.email, 
        credentials.password
      );
      
      const legacyToken = this.legacyAuth.generateLegacyToken(legacyUser);
      console.log('✓ Autenticación legacy exitosa');

      // Paso 2: Intercambiar token legacy por tokens OIDC de Keycloak
      console.log('Paso 2: Intercambiando token con Keycloak...');
      const keycloakTokens = await this.keycloakService.exchangeLegacyToken(legacyToken);
      console.log('✓ Token exchange con Keycloak exitoso');

      // Paso 3: Verificar si el usuario existe en Supabase
      console.log('Paso 3: Verificando usuario en Supabase...');
      const userExists = await this.supabaseService.userExists(legacyUser.email);
      
      if (!userExists) {
        console.log('✗ Usuario no encontrado en Supabase');
        return {
          success: false,
          message: 'Usuario no encontrado en Supabase. El usuario debe existir previamente.',
          error: AuthErrorCodes.USER_NOT_FOUND_IN_SUPABASE
        };
      }
      console.log('✓ Usuario encontrado en Supabase');

      // Paso 4: Crear sesión en Supabase
      console.log('Paso 4: Creando sesión en Supabase...');
      const supabaseSession = await this.supabaseService.createSessionWithIdToken(
        keycloakTokens.id_token,
        legacyUser.email
      );
      console.log('✓ Sesión creada en Supabase');

      return {
        success: true,
        message: 'Flujo de autenticación completado exitosamente',
        data: {
          supabaseSession,
          keycloakTokens
        }
      };

    } catch (error) {
      console.error('Error en flujo completo de autenticación:', error);
      
      if (error instanceof Error) {
        // Mapear errores específicos
        switch (error.message) {
          case AuthErrorCodes.INVALID_CREDENTIALS:
            return {
              success: false,
              message: 'Credenciales inválidas',
              error: AuthErrorCodes.INVALID_CREDENTIALS
            };
          
          case AuthErrorCodes.KEYCLOAK_ERROR:
            return {
              success: false,
              message: 'Error en la comunicación con Keycloak',
              error: AuthErrorCodes.KEYCLOAK_ERROR
            };
          
          case AuthErrorCodes.USER_NOT_FOUND_IN_SUPABASE:
            return {
              success: false,
              message: 'Usuario no encontrado en Supabase',
              error: AuthErrorCodes.USER_NOT_FOUND_IN_SUPABASE
            };
          
          case AuthErrorCodes.SUPABASE_ERROR:
            return {
              success: false,
              message: 'Error en la comunicación con Supabase',
              error: AuthErrorCodes.SUPABASE_ERROR
            };
          
          default:
            return {
              success: false,
              message: 'Error interno del servidor',
              error: 'INTERNAL_ERROR'
            };
        }
      }

      return {
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Flujo simplificado que solo valida credenciales legacy
   */
  async validateLegacyCredentials(credentials: LoginRequest): Promise<AuthFlowResponse> {
    try {
      const legacyUser = await this.legacyAuth.authenticateUser(
        credentials.email, 
        credentials.password
      );
      
      const legacyToken = this.legacyAuth.generateLegacyToken(legacyUser);

      return {
        success: true,
        message: 'Credenciales legacy válidas',
        data: {
          user: legacyUser,
          legacyToken
        }
      };

    } catch (error) {
      console.error('Error validando credenciales legacy:', error);
      
      if (error instanceof Error && error.message === AuthErrorCodes.INVALID_CREDENTIALS) {
        return {
          success: false,
          message: 'Credenciales inválidas',
          error: AuthErrorCodes.INVALID_CREDENTIALS
        };
      }

      return {
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Verifica el estado de todos los servicios
   */
  async healthCheck(): Promise<{
    legacy: boolean;
    keycloak: boolean;
    supabase: boolean;
    overall: boolean;
  }> {
    const results = {
      legacy: true, // Legacy siempre está disponible (es simulado)
      keycloak: false,
      supabase: false,
      overall: false
    };

    try {
      // Verificar Keycloak
      await this.keycloakService['getAdminToken']();
      results.keycloak = true;
    } catch (error) {
      console.error('Keycloak health check failed:', error);
    }

    try {
      // Verificar Supabase
      results.supabase = await this.supabaseService.healthCheck();
    } catch (error) {
      console.error('Supabase health check failed:', error);
    }

    results.overall = results.legacy && results.keycloak && results.supabase;

    return results;
  }
}
