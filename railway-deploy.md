# Despliegue en Railway

Railway es una plataforma de despliegue muy fácil y tiene un tier gratuito generoso.

## Pasos:

### 1. Preparar el proyecto
```bash
# Crear archivo railway.json
echo '{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}' > railway.json
```

### 2. Crear cuenta en Railway
- Ve a https://railway.app
- Conecta tu cuenta de GitHub
- Importa este repositorio

### 3. Configurar variables de entorno
En Railway Dashboard:
```
NODE_ENV=production
PORT=3000
```

### 4. Desplegar
- Railway detectará automáticamente que es un proyecto Node.js
- Usará el comando `npm start` para ejecutar
- Te dará una URL como: `https://tu-proyecto.railway.app`

### 5. Actualizar configuración
Cambiar en `src/config.ts`:
```typescript
baseUrl: 'https://tu-proyecto.railway.app',
issuer: 'https://tu-proyecto.railway.app',
authorization_endpoint: 'https://tu-proyecto.railway.app/authorize',
// etc...
```
