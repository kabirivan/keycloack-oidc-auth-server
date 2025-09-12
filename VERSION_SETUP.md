# Configuración de Versión

El sistema ahora incluye información de versión visible en el formulario de login y en los endpoints de API.

## Variables de Entorno para Versión

Puedes configurar las siguientes variables de entorno para personalizar la información de versión:

```bash
# Versión de la aplicación
APP_VERSION=1.0.0

# Fecha de build (formato ISO)
BUILD_DATE=2024-01-15T10:30:00.000Z

# Entorno de ejecución
NODE_ENV=production
```

## Valores por Defecto

Si no se configuran las variables de entorno, el sistema usará:

- **APP_VERSION**: `1.0.0`
- **BUILD_DATE**: Fecha actual del sistema
- **NODE_ENV**: `development`

## Visualización en el Formulario de Login

El formulario de login ahora muestra:

- **Versión**: `v1.0.0` (con estilo destacado)
- **Environment**: `development` (con badge)
- **Build Date**: Fecha formateada del build

### Ejemplo Visual

```
┌─────────────────────────────────┐
│        🔐 Iniciar Sesión        │
│      OIDC Identity Provider     │
│                                 │
│  Email: [________________]      │
│  Contraseña: [____________]     │
│                                 │
│  [    Iniciar Sesión    ]       │
│                                 │
│  Credenciales de prueba:        │
│  Email: hortiz@libelulasoft.com │
│  Contraseña: baLexI             │
│                                 │
│  ─────────────────────────────  │
│  v1.0.0 [development]           │
│  Build: 15/01/2024              │
└─────────────────────────────────┘
```

## Endpoints con Información de Versión

### GET /

```json
{
  "message": "OIDC Identity Provider con Hono.js",
  "version": "1.0.0",
  "buildDate": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "endpoints": { ... },
  "testUser": { ... }
}
```

### GET /health

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "memory": { ... },
  "version": "1.0.0",
  "buildDate": "2024-01-15T10:30:00.000Z",
  "environment": "production"
}
```

## Configuración para Diferentes Entornos

### Desarrollo Local

```bash
# .env.local
APP_VERSION=1.0.0-dev
NODE_ENV=development
BUILD_DATE=2024-01-15T10:30:00.000Z
```

### Staging

```bash
# .env.staging
APP_VERSION=1.0.0-staging
NODE_ENV=staging
BUILD_DATE=2024-01-15T10:30:00.000Z
```

### Producción

```bash
# .env.production
APP_VERSION=1.0.0
NODE_ENV=production
BUILD_DATE=2024-01-15T10:30:00.000Z
```

## Integración con CI/CD

### GitHub Actions

```yaml
- name: Set version variables
  run: |
    echo "APP_VERSION=${{ github.ref_name }}" >> $GITHUB_ENV
    echo "BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" >> $GITHUB_ENV
    echo "NODE_ENV=production" >> $GITHUB_ENV
```

### Railway

```bash
# Variables de entorno en Railway
APP_VERSION=1.0.0
NODE_ENV=production
BUILD_DATE=2024-01-15T10:30:00.000Z
```

## Pruebas

Ejecuta el script de prueba para verificar la visualización de versión:

```bash
./test-version-display.sh
```

Este script verificará:
- ✅ Versión mostrada en el formulario
- ✅ Environment mostrado correctamente
- ✅ Fecha de build visible
- ✅ Estilos CSS aplicados correctamente
