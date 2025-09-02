import { config as loadEnv } from 'dotenv';

// Cargar variables de entorno
loadEnv();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  
  // Configuración de Keycloak
  keycloak: {
    baseUrl: process.env.KEYCLOAK_BASE_URL || '',
    realm: process.env.KEYCLOAK_REALM || '',
    clientId: process.env.KEYCLOAK_CLIENT_ID || '',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
    adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME || '',
    adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || '',
  },
  
  // Configuración de Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  // JWT Secret para tokens legacy
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Usuario demo legacy (seed)
  legacyUser: {
    email: 'xaguas@allient.io',
    password: 'mK9a5T6NhYfqWy', // En producción esto debería estar hasheado
    name: 'Xavier Aguas',
    roles: ['user', 'admin']
  }
};

// Validar configuración requerida
export function validateConfig() {
  const required = [
    'KEYCLOAK_BASE_URL',
    'KEYCLOAK_REALM', 
    'KEYCLOAK_CLIENT_ID',
    'KEYCLOAK_CLIENT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }
}
