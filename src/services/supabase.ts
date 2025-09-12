import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// Tipos para la tabla user de Supabase
export interface SupabaseUser {
  id: string;
  full_name: string;
  enabled: boolean | null;
  email: string;
  company_id: string | null;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string | null;
  updated_at: string | null;
}

export interface UserRole {
  user: 'user';
  admin: 'admin';
  super_admin: 'super_admin';
}

export class SupabaseService {
  private static client: SupabaseClient | null = null;

  /**
   * Inicializa el cliente de Supabase para consultas directas sin autenticación
   */
  private static initializeClient(): SupabaseClient {
    if (!this.client) {
      const supabaseUrl = config.supabase.url || config.supabase.defaultUrl;
      const supabaseKey = config.supabase.anonKey || config.supabase.defaultAnonKey;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Configuración de Supabase no encontrada');
      }

      // Crear cliente de Supabase solo con clave anónima (sin autenticación de usuario)
      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          // Deshabilitar autenticación automática
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });
    }
    return this.client;
  }

  /**
   * Obtiene un usuario por email desde Supabase usando consulta directa (sin autenticación)
   * @param email Email del usuario
   * @returns Promise<SupabaseUser | null> Usuario encontrado o null
   */
  static async getUserByEmail(email: string): Promise<SupabaseUser | null> {
    try {
      console.log(`🔍 Consultando usuario en Supabase (sin autenticación): ${email}`);
      
      const supabase = this.initializeClient();
      
      // Consultar usuario usando la librería oficial de Supabase (solo con clave anónima)
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('email', email)
        .eq('enabled', true) // Solo usuarios habilitados
        .single();

      if (error) {
        console.error('❌ Error consultando usuario en Supabase:', error);
        return null;
      }

      if (!data) {
        console.log(`❌ Usuario no encontrado en Supabase: ${email}`);
        return null;
      }

      console.log('✅ Usuario encontrado en Supabase (consulta directa):', {
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        enabled: data.enabled
      });

      return data as SupabaseUser;
    } catch (error) {
      console.error('❌ Error en consulta a Supabase:', error);
      return null;
    }
  }

  /**
   * Mapea un usuario de Supabase al formato OIDC
   * @param supabaseUser Usuario de Supabase
   * @returns Usuario en formato OIDC
   */
  static mapSupabaseUserToOIDC(supabaseUser: SupabaseUser): any {
    return {
      sub: `user-${supabaseUser.id}`, // Usar formato user-{id} para compatibilidad con Keycloak
      email: supabaseUser.email,
      email_verified: true,
      name: supabaseUser.full_name,
      given_name: supabaseUser.full_name.split(' ')[0] || supabaseUser.full_name,
      family_name: supabaseUser.full_name.split(' ').slice(1).join(' ') || '',
      preferred_username: supabaseUser.email.split('@')[0],
      // Campos adicionales de Supabase
      company_id: supabaseUser.company_id,
      role: supabaseUser.role,
      enabled: supabaseUser.enabled,
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at,
      // Campos específicos para Keycloak
      user_id: supabaseUser.id, // ID original de Supabase para referencia
      external_id: supabaseUser.id // ID externo para Keycloak
    };
  }

  /**
   * Valida que un usuario existe y está habilitado en Supabase
   * @param email Email del usuario
   * @returns Promise<boolean> true si el usuario existe y está habilitado
   */
  static async validateUserExists(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      return user !== null && user.enabled === true;
    } catch (error) {
      console.error('❌ Error validando usuario en Supabase:', error);
      return false;
    }
  }
}
