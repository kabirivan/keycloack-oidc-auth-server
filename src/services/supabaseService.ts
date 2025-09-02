import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { SupabaseUser, AuthErrorCodes } from '../types';

export class SupabaseService {
  private static instance: SupabaseService;
  private supabase: SupabaseClient;

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  /**
   * Busca un usuario en Supabase por email
   * NO crea el usuario si no existe
   */
  async findUserByEmail(email: string): Promise<SupabaseUser | null> {
    try {
      const { data, error } = await this.supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });

      if (error) {
        console.error('Error listando usuarios de Supabase:', error);
        throw new Error(AuthErrorCodes.SUPABASE_ERROR);
      }

      // Buscar usuario por email
      const user = data.users.find(u => u.email === email);
      
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at
      };

    } catch (error) {
      console.error('Error buscando usuario en Supabase:', error);
      throw new Error(AuthErrorCodes.SUPABASE_ERROR);
    }
  }

  /**
   * Verifica si un usuario existe en Supabase
   */
  async userExists(email: string): Promise<boolean> {
    try {
      const user = await this.findUserByEmail(email);
      return user !== null;
    } catch (error) {
      console.error('Error verificando existencia de usuario:', error);
      return false;
    }
  }

  /**
   * Crea una sesión en Supabase para un usuario existente
   * usando un ID Token de Keycloak
   */
  async createSessionWithIdToken(idToken: string, email: string): Promise<any> {
    try {
      // Primero verificar que el usuario existe
      const userExists = await this.userExists(email);
      
      if (!userExists) {
        throw new Error(AuthErrorCodes.USER_NOT_FOUND_IN_SUPABASE);
      }

      // Crear sesión usando el ID Token
      // En un escenario real, esto se haría con un flujo más complejo
      // que valide el ID Token contra Keycloak
      const { data, error } = await this.supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      });

      if (error) {
        console.error('Error generando link de sesión:', error);
        throw new Error(AuthErrorCodes.SUPABASE_ERROR);
      }

      // Simular una sesión exitosa
      // En producción, esto se haría con un flujo más robusto
      const sessionData = {
        access_token: `supabase_${Date.now()}`,
        refresh_token: `refresh_${Date.now()}`,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: data.user?.id,
          email: email,
          created_at: data.user?.created_at,
          updated_at: data.user?.updated_at
        }
      };

      return sessionData;

    } catch (error) {
      console.error('Error creando sesión en Supabase:', error);
      throw error;
    }
  }

  /**
   * Valida un token de sesión de Supabase
   */
  async validateSession(sessionToken: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.auth.getUser(sessionToken);

      if (error) {
        console.error('Error validando sesión:', error);
        throw new Error(AuthErrorCodes.SUPABASE_ERROR);
      }

      return data;

    } catch (error) {
      console.error('Error validando sesión de Supabase:', error);
      throw new Error(AuthErrorCodes.SUPABASE_ERROR);
    }
  }

  /**
   * Obtiene información de un usuario por ID
   */
  async getUserById(userId: string): Promise<SupabaseUser | null> {
    try {
      const { data, error } = await this.supabase.auth.admin.getUserById(userId);

      if (error) {
        console.error('Error obteniendo usuario por ID:', error);
        return null;
      }

      if (!data.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at
      };

    } catch (error) {
      console.error('Error obteniendo usuario por ID:', error);
      return null;
    }
  }

  /**
   * Verifica la salud de la conexión con Supabase
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Intentar listar usuarios para verificar conectividad
      const { error } = await this.supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });

      return !error;
    } catch (error) {
      console.error('Error en health check de Supabase:', error);
      return false;
    }
  }
}
