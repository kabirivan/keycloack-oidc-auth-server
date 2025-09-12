import { Hono } from 'hono';
import { config } from '../config.js';
import { JWTService } from '../utils/jwt.js';
import { ExternalAuthService } from '../services/externalAuth.js';
import { SupabaseService } from '../services/supabase.js';

const token = new Hono();

// Endpoint POST /token - Intercambia código por tokens
token.post('/token', async (c) => {
  const contentType = c.req.header('content-type') || '';
  
  let grantType: string;
  let code: string;
  let redirectUri: string;
  let clientId: string;
  let clientSecret: string;
  let username: string;
  let password: string;
  let scope: string;

  // Parsear datos según el Content-Type
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await c.req.parseBody();
    grantType = formData.grant_type as string;
    code = formData.code as string;
    redirectUri = formData.redirect_uri as string;
    clientId = formData.client_id as string;
    clientSecret = formData.client_secret as string;
    username = formData.username as string;
    password = formData.password as string;
    scope = (formData.scope as string) || 'openid';
  } else {
    const body = await c.req.json();
    grantType = body.grant_type;
    code = body.code;
    redirectUri = body.redirect_uri;
    clientId = body.client_id;
    clientSecret = body.client_secret;
    username = body.username;
    password = body.password;
    scope = body.scope || 'openid';
  }

  if (!grantType) {
    return c.json({ 
      error: 'invalid_request',
      error_description: 'grant_type es requerido'
    }, 400);
  }

  // Manejar authorization_code grant
  if (grantType === 'authorization_code') {
    if (!code || !redirectUri || !clientId) {
      return c.json({ 
        error: 'invalid_request',
        error_description: 'code, redirect_uri y client_id son requeridos'
      }, 400);
    }

    // Validar y consumir código de autorización
    const authCodeData = JWTService.validateAndConsumeAuthorizationCode(code);
    
    if (!authCodeData) {
      return c.json({ 
        error: 'invalid_grant',
        error_description: 'Código de autorización inválido o expirado'
      }, 400);
    }

    // Verificar que el redirect_uri coincida
    if (authCodeData.redirectUri !== redirectUri) {
      return c.json({ 
        error: 'invalid_grant',
        error_description: 'redirect_uri no coincide'
      }, 400);
    }

    // Verificar que el client_id coincida
    if (authCodeData.clientId !== clientId) {
      return c.json({ 
        error: 'invalid_grant',
        error_description: 'client_id no coincide'
      }, 400);
    }

    // Validar client_secret
    if (!clientSecret || clientSecret !== 'keycloak-client-secret-2024-secure') {
      return c.json({ 
        error: 'invalid_client',
        error_description: 'client_secret inválido'
      }, 400);
    }

    // Obtener datos del usuario desde Supabase usando el userId almacenado
    const supabaseUser = await SupabaseService.getUserByEmail(config.testUser.email);
    const userForTokens = supabaseUser ? 
      SupabaseService.mapSupabaseUserToOIDC(supabaseUser) : 
      config.testUser;

    // Generar tokens con datos del usuario
    const accessToken = await JWTService.generateAccessToken(
      userForTokens,
      clientId,
      authCodeData.scope
    );

    const idToken = await JWTService.generateIdToken(
      userForTokens,
      clientId,
      undefined // nonce no disponible en este punto
    );

    // Almacenar token de acceso
    JWTService.storeAccessToken(
      accessToken,
      userForTokens.sub,
      clientId,
      authCodeData.scope
    );

    return c.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      id_token: idToken,
      scope: authCodeData.scope
    });
  }

  // Manejar password grant
  if (grantType === 'password') {
    if (!username || !password || !clientId) {
      return c.json({ 
        error: 'invalid_request',
        error_description: 'username, password y client_id son requeridos'
      }, 400);
    }

    // Validar client_secret
    if (!clientSecret || clientSecret !== 'keycloak-client-secret-2024-secure') {
      return c.json({ 
        error: 'invalid_client',
        error_description: 'client_secret inválido'
      }, 400);
    }

    // Validar credenciales usando autenticación externa y Supabase
    console.log(`🔐 Iniciando validación externa con Supabase para grant password: ${username}`);
    
    const authenticatedUser = await ExternalAuthService.authenticateUserWithSupabase(username, password);
    
    if (!authenticatedUser) {
      console.log(`❌ Validación externa con Supabase fallida para: ${username}`);
      return c.json({ 
        error: 'invalid_grant',
        error_description: 'Credenciales inválidas, error en autenticación externa o usuario no encontrado en Supabase'
      }, 400);
    }

    console.log(`✅ Validación externa con Supabase exitosa para grant password: ${username}`);
    console.log(`👤 Usuario autenticado: ${authenticatedUser.oidcUser.name} (${authenticatedUser.oidcUser.email})`);

    // Generar tokens con datos del usuario de Supabase
    const accessToken = await JWTService.generateAccessToken(
      authenticatedUser.oidcUser,
      clientId,
      scope
    );

    const idToken = await JWTService.generateIdToken(
      authenticatedUser.oidcUser,
      clientId
    );

    // Almacenar token de acceso
    JWTService.storeAccessToken(
      accessToken,
      authenticatedUser.oidcUser.sub,
      clientId,
      scope
    );

    return c.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      id_token: idToken,
      scope: scope
    });
  }

  // Grant type no soportado
  return c.json({ 
    error: 'unsupported_grant_type',
    error_description: `Grant type '${grantType}' no soportado`
  }, 400);
});

export default token;
