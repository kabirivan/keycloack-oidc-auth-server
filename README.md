# OIDC Identity Provider con Hono.js

Un proveedor de identidad OIDC (OpenID Connect) implementado con Hono.js que funciona como servidor de autenticación para Keycloak.

## 🚀 Características

- ✅ Endpoint de descubrimiento OIDC (`/.well-known/openid-configuration`)
- ✅ Flujo de autorización OAuth 2.0 con formulario HTML
- ✅ Intercambio de códigos de autorización por tokens JWT
- ✅ Soporte para grant types: `authorization_code` y `password`
- ✅ Endpoint de información de usuario protegido con JWT
- ✅ Endpoint JWKS para claves de verificación
- ✅ Almacenamiento en memoria (sin base de datos)
- ✅ JWT con algoritmo HS256

## 👤 Usuario de Prueba

- **Email:** `hortiz@libelulasoft.com`
- **Contraseña:** `baLexI`

## 📋 Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | GET | Información del servidor |
| `/.well-known/openid-configuration` | GET | Descubrimiento OIDC |
| `/authorize` | GET | Formulario de login |
| `/authorize` | POST | Procesar login y redirigir |
| `/token` | POST | Intercambiar código por tokens |
| `/userinfo` | GET/POST | Información del usuario (protegido) |
| `/jwks` | GET | Claves JWK |

## 🛠️ Instalación y Uso

### Prerrequisitos

- [Bun](https://bun.sh/) (recomendado) o Node.js

### Instalación

```bash
# Instalar dependencias
bun install

# Ejecutar en modo desarrollo
bun run dev

# O compilar y ejecutar
bun run build
bun run start
```

El servidor se ejecutará en `http://localhost:3000`

## 🔧 Configuración con Keycloak

### 1. Crear un Identity Provider en Keycloak

1. Ve a **Identity Providers** en el admin console de Keycloak
2. Selecciona **OpenID Connect v1.0**
3. Configura los siguientes valores:

```
Alias: oidc-hono-provider
Display Name: OIDC Hono Provider
Authorization URL: http://localhost:3000/authorize
Token URL: http://localhost:3000/token
User Info URL: http://localhost:3000/userinfo
Client ID: keycloak-client
Client Secret: (dejar vacío o usar cualquier valor)
```

### 2. Configurar el Discovery Endpoint

En la sección **Advanced Settings**:
- **Discovery Endpoint**: `http://localhost:3000/.well-known/openid-configuration`
- **Validate Signature**: `Off` (ya que usamos HS256 con clave compartida)

### 3. Mapeo de Atributos

En la sección **Attribute Mappers**:
- **Username**: `preferred_username`
- **Email**: `email`
- **First Name**: `given_name`
- **Last Name**: `family_name`

## 🧪 Pruebas

### 1. Probar el Discovery Endpoint

```bash
curl http://localhost:3000/.well-known/openid-configuration
```

### 2. Probar el Flujo de Autorización

```bash
# 1. Iniciar flujo de autorización
curl "http://localhost:3000/authorize?client_id=test-client&redirect_uri=http://localhost:8080/callback&response_type=code&scope=openid%20profile%20email&state=random-state"
```

### 3. Probar el Endpoint de Token

```bash
# 2. Intercambiar código por token (después de obtener el código del paso anterior)
curl -X POST http://localhost:3000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=CODIGO_AQUI&redirect_uri=http://localhost:8080/callback&client_id=test-client"
```

### 4. Probar el Endpoint UserInfo

```bash
# 3. Obtener información del usuario
curl -H "Authorization: Bearer ACCESS_TOKEN_AQUI" \
  http://localhost:3000/userinfo
```

### 5. Probar Grant Type Password

```bash
curl -X POST http://localhost:3000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=hortiz@libelulasoft.com&password=baLexI&client_id=test-client&scope=openid%20profile%20email"
```

## 🔐 Seguridad

⚠️ **Nota de Seguridad**: Esta implementación es para propósitos de desarrollo y pruebas. Para producción:

- Usar claves JWT más seguras y rotar regularmente
- Implementar validación de client_id y client_secret
- Usar HTTPS
- Implementar rate limiting
- Agregar logging y monitoreo
- Usar una base de datos real para almacenar códigos y tokens

## 📁 Estructura del Proyecto

```
src/
├── config.ts              # Configuración del servidor
├── index.ts               # Punto de entrada de la aplicación
├── utils/
│   └── jwt.ts            # Servicio JWT y almacenamiento en memoria
└── routes/
    ├── well-known.ts     # Endpoint de descubrimiento OIDC
    ├── authorize.ts      # Endpoints de autorización
    ├── token.ts          # Endpoint de intercambio de tokens
    ├── userinfo.ts       # Endpoint de información de usuario
    └── jwks.ts           # Endpoint de claves JWK
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.
