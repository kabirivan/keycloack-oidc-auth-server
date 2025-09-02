# Despliegue en Render (100% Gratuito)

## Pasos súper simples:

### 1. Crear cuenta en Render
- Ve a https://render.com
- Conecta con GitHub

### 2. Crear nuevo Web Service
- Haz clic en "New" → "Web Service"
- Conecta tu repositorio de GitHub
- Render detectará automáticamente que es Node.js

### 3. Configuración automática
Render detectará:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: `Node`

### 4. Variables de entorno (opcional)
```
NODE_ENV=production
```

### 5. Deploy
- Haz clic en "Create Web Service"
- Render construirá y desplegará automáticamente
- Te dará una URL como: `https://tu-proyecto.onrender.com`

### 6. Configurar en Keycloak
Usa la URL de Render en tu Keycloak Cloud:
- **Authorization URL**: `https://tu-proyecto.onrender.com/authorize`
- **Token URL**: `https://tu-proyecto.onrender.com/token`
- **User Info URL**: `https://tu-proyecto.onrender.com/userinfo`
- **Discovery Endpoint**: `https://tu-proyecto.onrender.com/.well-known/openid-configuration`

## ✅ Ventajas de Render:
- 100% gratis para siempre
- No se duerme (aunque puede ser lento al inicio)
- HTTPS automático
- Deploy automático
- Logs en tiempo real
- Fácil de usar
