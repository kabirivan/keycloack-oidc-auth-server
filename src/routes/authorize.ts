import { Hono } from 'hono';
import { config } from '../config.js';
import { JWTService } from '../utils/jwt.js';
import { ExternalAuthService } from '../services/externalAuth.js';

const authorize = new Hono();

// Endpoint GET /authorize - Muestra formulario de login
authorize.get('/authorize', (c) => {
  const clientId = c.req.query('client_id');
  const redirectUri = c.req.query('redirect_uri');
  const responseType = c.req.query('response_type');
  const scope = c.req.query('scope') || 'openid';
  const state = c.req.query('state');
  const nonce = c.req.query('nonce');

  // Validaciones básicas
  if (!clientId || !redirectUri || !responseType) {
    return c.json({ 
      error: 'invalid_request',
      error_description: 'Faltan parámetros requeridos: client_id, redirect_uri, response_type'
    }, 400);
  }

  if (responseType !== 'code') {
    return c.json({ 
      error: 'unsupported_response_type',
      error_description: 'Solo se soporta response_type=code'
    }, 400);
  }

  // Validar redirect_uri permitidos
  const allowedRedirectUris = [
    'https://staging-aig-agil.allient.io/',
    'https://staging-aig-agil.allient.io',
    'https://keycloak-o4wc4ckkc8s0osok8wsgksgc.allient.io/realms/supabase-realm/broker/oidc-hono-provider/endpoint',
    'http://localhost:8080/callback' // Para desarrollo local
  ];

  if (!allowedRedirectUris.some(uri => redirectUri.startsWith(uri))) {
    return c.json({ 
      error: 'invalid_request',
      error_description: 'redirect_uri no permitido'
    }, 400);
  }

  // Generar HTML del formulario de login
  const loginForm = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Iniciar Sesión - OIDC Provider</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .login-container {
                background: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
            }
            .login-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            .login-header h1 {
                color: #333;
                margin: 0;
                font-size: 1.8rem;
            }
            .login-header p {
                color: #666;
                margin: 0.5rem 0 0 0;
            }
            .form-group {
                margin-bottom: 1.5rem;
            }
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #333;
                font-weight: 500;
            }
            .form-group input {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e1e5e9;
                border-radius: 5px;
                font-size: 1rem;
                transition: border-color 0.3s;
                box-sizing: border-box;
            }
            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }
            .login-button {
                width: 100%;
                padding: 0.75rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .login-button:hover {
                transform: translateY(-2px);
            }
            .login-button:active {
                transform: translateY(0);
            }
            .test-credentials {
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 5px;
                margin-top: 1rem;
                font-size: 0.9rem;
                color: #666;
            }
            .test-credentials strong {
                color: #333;
            }
            .version-info {
                text-align: center;
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 1px solid #e1e5e9;
                font-size: 0.8rem;
                color: #888;
            }
            .version-info .version {
                font-weight: 600;
                color: #667eea;
            }
            .version-info .environment {
                margin-left: 0.5rem;
                padding: 0.2rem 0.5rem;
                background: #f0f0f0;
                border-radius: 3px;
                font-size: 0.7rem;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="login-header">
                <h1>🔐 Iniciar Sesión</h1>
                <p>OIDC Identity Provider</p>
            </div>
            
            <form method="POST" action="/authorize">
                <input type="hidden" name="client_id" value="${clientId}">
                <input type="hidden" name="redirect_uri" value="${redirectUri}">
                <input type="hidden" name="response_type" value="${responseType}">
                <input type="hidden" name="scope" value="${scope}">
                ${state ? `<input type="hidden" name="state" value="${state}">` : ''}
                ${nonce ? `<input type="hidden" name="nonce" value="${nonce}">` : ''}
                
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Contraseña:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="login-button">Iniciar Sesión</button>
            </form>
            
            <div class="test-credentials">
                <strong>Credenciales de prueba:</strong><br>
                Email: hortiz@libelulasoft.com<br>
                Contraseña: baLexI
            </div>
            
            <div class="version-info">
                <span class="version">v${config.version}</span>
                <span class="environment">${config.environment}</span>
                <br>
                <small>Build: ${new Date(config.buildDate).toLocaleDateString()}</small>
            </div>
        </div>
    </body>
    </html>
  `;

  return c.html(loginForm);
});

// Endpoint POST /authorize - Procesa el login
authorize.post('/authorize', async (c) => {
  const formData = await c.req.parseBody();
  
  const clientId = formData.client_id as string;
  const redirectUri = formData.redirect_uri as string;
  const responseType = formData.response_type as string;
  const scope = (formData.scope as string) || 'openid';
  const state = formData.state as string;
  const nonce = formData.nonce as string;
  const email = formData.email as string;
  const password = formData.password as string;

  // Validar credenciales usando autenticación externa
  console.log(`🔐 Iniciando validación externa para: ${email}`);
  
  const isValidExternalAuth = await ExternalAuthService.validateAccessTokenExists(email, password);
  
  if (!isValidExternalAuth) {
    console.log(`❌ Validación externa fallida para: ${email}`);
    return c.json({ 
      error: 'access_denied',
      error_description: 'Credenciales inválidas o error en autenticación externa'
    }, 400);
  }

  console.log(`✅ Validación externa exitosa para: ${email}`);

  // Consultar usuario en Supabase para reemplazar testUser con datos reales
  const supabaseUser = await ExternalAuthService.getUserFromSupabase(email);
  const userForAuth = supabaseUser ? supabaseUser.oidcUser : config.testUser;
  
  if (supabaseUser) {
    console.log(`👤 Usando datos de Supabase: ${userForAuth.name} (${userForAuth.email})`);
  } else {
    console.log(`👤 Usando datos de prueba: ${userForAuth.name} (${userForAuth.email})`);
  }

  // Generar código de autorización
  const authCode = JWTService.generateAuthorizationCode();
  
  // Almacenar código de autorización con datos del usuario (Supabase o testUser)
  JWTService.storeAuthorizationCode(
    authCode,
    clientId,
    redirectUri,
    state,
    scope,
    userForAuth.sub
  );

  // Construir URL de redirección
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set('code', authCode);
  if (state) {
    redirectUrl.searchParams.set('state', state);
  }

  return c.redirect(redirectUrl.toString());
});

export default authorize;
