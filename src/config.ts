// Cargar variables de entorno primero
import 'dotenv/config';

// Configuración del servidor OIDC
export const config = {
  // Información de versión
  version: process.env.APP_VERSION || '1.0.0',
  buildDate: process.env.BUILD_DATE || new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  
  // Puerto del servidor (Railway usa PORT automáticamente)
  port: parseInt(process.env.PORT || '3000'),
  
  // URL base del servidor (se actualizará automáticamente en producción)
  baseUrl: process.env.PORT ? 'https://keycloack-oidc-auth-server-production.up.railway.app' : 'http://localhost:3000',
  
  // Clave secreta para JWT (en producción usar una clave más segura)
  jwtSecret: 'mi-clave-secreta-super-segura-para-jwt-oidc-keycloak-2024',
  
  // Usuario de prueba en memoria (se sobrescribirá con datos de Supabase)
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'hortiz@libelulasoft.com',
    password: process.env.TEST_USER_PASSWORD || 'baLexI',
    sub: 'user-123',
    name: 'Hortiz Test User',
    given_name: 'Hortiz',
    family_name: 'Test',
    preferred_username: 'hortiz',
    email_verified: true
  },

  // Configuración de Supabase (consultas directas sin autenticación)
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    // Configuración por defecto para desarrollo (debes configurar las variables de entorno)
    defaultUrl: 'https://your-project.supabase.co',
    defaultAnonKey: 'your-anon-key'
  },

  // Configuración de autenticación externa
  externalAuth: {
    authUrl: process.env.EXTERNAL_AUTH_URL,
    tokenValidationUrl: process.env.EXTERNAL_TOKEN_VALIDATION_URL
  },
  
  // Configuración OIDC
  oidc: {
    issuer: process.env.PORT ? 'https://keycloack-oidc-auth-server-production.up.railway.app' : 'http://localhost:3000',
    authorization_endpoint: process.env.PORT ? 'https://keycloack-oidc-auth-server-production.up.railway.app/authorize' : 'http://localhost:3000/authorize',
    token_endpoint: process.env.PORT ? 'https://keycloack-oidc-auth-server-production.up.railway.app/token' : 'http://localhost:3000/token',
    userinfo_endpoint: process.env.PORT ? 'https://keycloack-oidc-auth-server-production.up.railway.app/userinfo' : 'http://localhost:3000/userinfo',
    jwks_uri: process.env.PORT ? 'https://keycloack-oidc-auth-server-production.up.railway.app/jwks' : 'http://localhost:3000/jwks',
    response_types_supported: ['code', 'id_token', 'token'],
    grant_types_supported: ['authorization_code', 'password'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    scopes_supported: ['openid', 'profile', 'email'],
    claims_supported: ['sub', 'name', 'given_name', 'family_name', 'email', 'email_verified', 'preferred_username']
  }
};
