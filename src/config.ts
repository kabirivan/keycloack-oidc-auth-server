// Configuración del servidor OIDC
export const config = {
  // Puerto del servidor (Railway usa PORT automáticamente)
  port: parseInt(process.env.PORT || '3000'),
  
  // URL base del servidor (se actualizará automáticamente en producción)
  baseUrl: process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'https://keycloack-oidc-auth-server-production.up.railway.app',
  
  // Clave secreta para JWT (en producción usar una clave más segura)
  jwtSecret: 'mi-clave-secreta-super-segura-para-jwt-oidc-keycloak-2024',
  
  // Usuario de prueba en memoria
  testUser: {
    email: 'hortiz@libelulasoft.com',
    password: 'baLexI',
    sub: 'user-123',
    name: 'Hortiz Test User',
    given_name: 'Hortiz',
    family_name: 'Test',
    preferred_username: 'hortiz',
    email_verified: true
  },
  
  // Configuración OIDC
  oidc: {
    issuer: process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'https://keycloack-oidc-auth-server-production.up.railway.app',
    authorization_endpoint: process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/authorize` : 'https://keycloack-oidc-auth-server-production.up.railway.app/authorize',
    token_endpoint: process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/token` : 'https://keycloack-oidc-auth-server-production.up.railway.app/token',
    userinfo_endpoint: process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/userinfo` : 'https://keycloack-oidc-auth-server-production.up.railway.app/userinfo',
    jwks_uri: process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/jwks` : 'https://keycloack-oidc-auth-server-production.up.railway.app/jwks',
    response_types_supported: ['code', 'id_token', 'token'],
    grant_types_supported: ['authorization_code', 'password'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    scopes_supported: ['openid', 'profile', 'email'],
    claims_supported: ['sub', 'name', 'given_name', 'family_name', 'email', 'email_verified', 'preferred_username']
  }
};
