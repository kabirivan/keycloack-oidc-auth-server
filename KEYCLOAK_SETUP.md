# Configuración de Keycloak con el Proveedor OIDC

Esta guía te ayudará a configurar Keycloak para usar nuestro proveedor de identidad OIDC personalizado.

## 🚀 Pasos de Configuración

### 1. Iniciar el Servidor OIDC

```bash
# Instalar dependencias
npm install

# Ejecutar el servidor
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### 2. Configurar Identity Provider en Keycloak

1. **Acceder al Admin Console de Keycloak**
   - Ve a `http://localhost:8080` (o tu URL de Keycloak)
   - Inicia sesión como administrador

2. **Crear un Identity Provider**
   - Ve a **Identity Providers** en el menú lateral
   - Haz clic en **Add provider** → **OpenID Connect v1.0**

3. **Configurar el Provider**
   ```
   Alias: oidc-hono-provider
   Display Name: OIDC Hono Provider
   Authorization URL: http://localhost:3000/authorize
   Token URL: http://localhost:3000/token
   User Info URL: http://localhost:3000/userinfo
   Client ID: keycloak-client
   Client Secret: (dejar vacío o usar cualquier valor)
   ```

4. **Configurar Discovery Endpoint**
   - En la sección **Advanced Settings**:
   - **Discovery Endpoint**: `http://localhost:3000/.well-known/openid-configuration`
   - **Validate Signature**: `Off` (ya que usamos HS256 con clave compartida)

### 3. Configurar Mapeo de Atributos

En la sección **Attribute Mappers**, agregar los siguientes mappers:

| Name | Mapper Type | User Attribute | Claim Name |
|------|-------------|----------------|------------|
| username | Attribute Importer | username | preferred_username |
| email | Attribute Importer | email | email |
| firstName | Attribute Importer | firstName | given_name |
| lastName | Attribute Importer | lastName | family_name |
| fullName | Attribute Importer | fullName | name |

### 4. Configurar el Client

1. **Crear un Client en Keycloak**
   - Ve a **Clients** → **Create**
   - **Client ID**: `test-app`
   - **Client Protocol**: `openid-connect`
   - **Access Type**: `confidential`

2. **Configurar Redirect URIs**
   - En la pestaña **Settings**:
   - **Valid Redirect URIs**: `http://localhost:3001/*`
   - **Web Origins**: `http://localhost:3001`

### 5. Probar la Integración

#### Opción 1: Usar el Flujo de Autorización

```bash
# 1. Iniciar flujo de autorización
curl "http://localhost:3000/authorize?client_id=keycloak-client&redirect_uri=http://localhost:8080/realms/master/account&response_type=code&scope=openid%20profile%20email&state=test-state"
```

#### Opción 2: Usar Grant Type Password

```bash
# Obtener tokens directamente
curl -X POST http://localhost:3000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=hortiz@libelulasoft.com&password=baLexI&client_id=keycloak-client&scope=openid%20profile%20email"
```

#### Opción 3: Probar UserInfo

```bash
# Usar el access_token obtenido del paso anterior
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/userinfo
```

## 🔧 Configuración Avanzada

### Configurar PKCE (Opcional)

Si quieres habilitar PKCE para mayor seguridad:

1. En el Identity Provider de Keycloak:
   - **PKCE Code Challenge Method**: `S256`

2. El servidor OIDC ya soporta PKCE con los métodos `S256` y `plain`

### Configurar Scopes Personalizados

Para agregar scopes personalizados, modifica `src/config.ts`:

```typescript
scopes_supported: ['openid', 'profile', 'email', 'custom_scope'],
claims_supported: ['sub', 'name', 'given_name', 'family_name', 'email', 'email_verified', 'preferred_username', 'custom_claim']
```

## 🧪 Pruebas de Integración

### 1. Verificar Discovery Endpoint

```bash
curl http://localhost:3000/.well-known/openid-configuration | jq .
```

### 2. Verificar JWKS

```bash
curl http://localhost:3000/jwks | jq .
```

### 3. Probar Flujo Completo

```bash
# Paso 1: Obtener código de autorización (simular login)
AUTH_URL="http://localhost:3000/authorize?client_id=keycloak-client&redirect_uri=http://localhost:8080/callback&response_type=code&scope=openid%20profile%20email&state=test-state"
echo "Visita: $AUTH_URL"

# Paso 2: Intercambiar código por token (usar el código del callback)
curl -X POST http://localhost:3000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=CODIGO_AQUI&redirect_uri=http://localhost:8080/callback&client_id=keycloak-client"

# Paso 3: Obtener información del usuario
curl -H "Authorization: Bearer ACCESS_TOKEN_AQUI" \
  http://localhost:3000/userinfo
```

## 🚨 Solución de Problemas

### Error: "Invalid redirect_uri"

- Verifica que el `redirect_uri` en la petición coincida exactamente con el configurado en Keycloak
- Asegúrate de que no haya espacios extra o caracteres especiales

### Error: "Invalid client_id"

- Verifica que el `client_id` sea correcto
- En nuestro caso, usa `keycloak-client` o cualquier valor que hayas configurado

### Error: "Invalid grant"

- Verifica que las credenciales del usuario sean correctas:
  - Email: `hortiz@libelulasoft.com`
  - Password: `baLexI`

### Error: "Token expired"

- Los tokens tienen una duración de 1 hora
- Genera nuevos tokens si han expirado

## 📝 Notas Importantes

1. **Seguridad**: Esta implementación es para desarrollo. En producción:
   - Usa HTTPS
   - Implementa validación de client_secret
   - Usa claves JWT más seguras
   - Implementa rate limiting

2. **Almacenamiento**: Los códigos de autorización y tokens se almacenan en memoria y se pierden al reiniciar el servidor

3. **Usuario de Prueba**: Solo hay un usuario configurado:
   - Email: `hortiz@libelulasoft.com`
   - Password: `baLexI`

4. **Compatibilidad**: El servidor es compatible con Keycloak 15+ y sigue los estándares OIDC 1.0
