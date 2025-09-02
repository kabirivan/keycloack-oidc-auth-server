import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { LegacyUser, KeycloakTokenResponse, AuthErrorCodes } from '../types';

export class KeycloakService {
  private static instance: KeycloakService;
  private adminClient: AxiosInstance;
  private tokenClient: AxiosInstance;
  private adminToken: string | null = null;
  private adminTokenExpiry: number = 0;

  public static getInstance(): KeycloakService {
    if (!KeycloakService.instance) {
      KeycloakService.instance = new KeycloakService();
    }
    return KeycloakService.instance;
  }

  constructor() {
    // Cliente para Admin API
    this.adminClient = axios.create({
      baseURL: `${config.keycloak.baseUrl}/admin/realms/${config.keycloak.realm}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Cliente para Token API
    this.tokenClient = axios.create({
      baseURL: `${config.keycloak.baseUrl}/realms/${config.keycloak.realm}/protocol/openid-connect`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Obtiene un token de administrador para usar la Admin API
   */
  private async getAdminToken(): Promise<string> {
    // Verificar si el token actual es válido
    if (this.adminToken && Date.now() < this.adminTokenExpiry) {
      return this.adminToken;
    }

    try {
      const response = await axios.post(
        `${config.keycloak.baseUrl}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: config.keycloak.adminUsername,
          password: config.keycloak.adminPassword,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.adminToken = response.data.access_token;
      this.adminTokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minuto de margen

      return this.adminToken;
    } catch (error) {
      console.error('Error obteniendo token de admin de Keycloak:', error);
      throw new Error(AuthErrorCodes.KEYCLOAK_ERROR);
    }
  }

  /**
   * Busca un usuario en Keycloak por email
   */
  async findUserByEmail(email: string): Promise<any | null> {
    try {
      const token = await this.getAdminToken();
      
      const response = await this.adminClient.get('/users', {
        params: {
          email,
          exact: true,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error buscando usuario en Keycloak:', error);
      return null;
    }
  }

  /**
   * Crea un usuario federado en Keycloak (sin password)
   * Este usuario actúa como un "proxy" para el usuario legacy
   */
  async createFederatedUser(legacyUser: LegacyUser): Promise<string> {
    try {
      const token = await this.getAdminToken();
      
      const userData = {
        username: legacyUser.email,
        email: legacyUser.email,
        firstName: legacyUser.name.split(' ')[0] || legacyUser.name,
        lastName: legacyUser.name.split(' ').slice(1).join(' ') || '',
        enabled: true,
        emailVerified: true,
        attributes: {
          legacyUserId: [legacyUser.id],
          legacyRoles: legacyUser.roles,
          federated: ['true'],
        },
      };

      const response = await this.adminClient.post('/users', userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Extraer el ID del usuario del header Location
      const location = response.headers.location;
      const userId = location?.split('/').pop();
      
      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario creado');
      }

      return userId;
    } catch (error) {
      console.error('Error creando usuario federado en Keycloak:', error);
      throw new Error(AuthErrorCodes.KEYCLOAK_ERROR);
    }
  }

  /**
   * Intercambia un token legacy por tokens OIDC de Keycloak
   * Implementa el flujo de Token Exchange (RFC 8693)
   */
  async exchangeLegacyToken(legacyToken: string): Promise<KeycloakTokenResponse> {
    try {
      // Primero, verificar que el token legacy es válido
      // En un escenario real, esto se haría contra el sistema legacy
      // Por ahora, asumimos que el token es válido y contiene la info del usuario
      
      // Buscar o crear usuario federado en Keycloak
      let keycloakUser = await this.findUserByEmail('xaguas@allient.io'); // Email del usuario demo
      
      if (!keycloakUser) {
        // Crear usuario federado
        const legacyUser: LegacyUser = {
          id: 'legacy-user-123',
          email: 'xaguas@allient.io',
          name: 'Xavier Aguas',
          roles: ['user', 'admin']
        };
        
        const userId = await this.createFederatedUser(legacyUser);
        keycloakUser = { id: userId };
      }

      // Realizar token exchange usando el flujo de Resource Owner Password Credentials
      // En producción, esto se haría con un flujo más seguro
      const response = await this.tokenClient.post('/token', new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        client_id: config.keycloak.clientId,
        client_secret: config.keycloak.clientSecret,
        subject_token: legacyToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
        audience: config.keycloak.clientId,
      }));

      return {
        access_token: response.data.access_token,
        id_token: response.data.id_token,
        refresh_token: response.data.refresh_token,
        token_type: response.data.token_type,
        expires_in: response.data.expires_in,
      };

    } catch (error) {
      console.error('Error en token exchange con Keycloak:', error);
      
      // Si el token exchange falla, intentar con flujo alternativo
      try {
        return await this.alternativeTokenFlow(legacyToken);
      } catch (altError) {
        console.error('Error en flujo alternativo:', altError);
        throw new Error(AuthErrorCodes.KEYCLOAK_ERROR);
      }
    }
  }

  /**
   * Flujo alternativo usando Resource Owner Password Credentials
   * Esto es para casos donde el token exchange no está disponible
   */
  private async alternativeTokenFlow(legacyToken: string): Promise<KeycloakTokenResponse> {
    // En este flujo alternativo, usamos las credenciales del usuario legacy
    // para obtener tokens directamente de Keycloak
    const response = await this.tokenClient.post('/token', new URLSearchParams({
      grant_type: 'password',
      client_id: config.keycloak.clientId,
      client_secret: config.keycloak.clientSecret,
      username: 'xaguas@allient.io',
      password: 'mK9a5T6NhYfqWy', // En producción, esto vendría del sistema legacy
    }));

    return {
      access_token: response.data.access_token,
      id_token: response.data.id_token,
      refresh_token: response.data.refresh_token,
      token_type: response.data.token_type,
      expires_in: response.data.expires_in,
    };
  }

  /**
   * Valida un token de Keycloak
   */
  async validateKeycloakToken(token: string): Promise<any> {
    try {
      const response = await this.tokenClient.post('/token/introspect', new URLSearchParams({
        token,
        client_id: config.keycloak.clientId,
        client_secret: config.keycloak.clientSecret,
      }));

      return response.data;
    } catch (error) {
      console.error('Error validando token de Keycloak:', error);
      throw new Error(AuthErrorCodes.KEYCLOAK_ERROR);
    }
  }
}
