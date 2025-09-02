# 🚀 Instrucciones para Desplegar en Railway

## Paso 1: Subir el código a GitHub

### 1.1 Inicializar Git (si no lo has hecho)
```bash
git init
git add .
git commit -m "Initial commit: OIDC Provider with Hono.js"
```

### 1.2 Crear repositorio en GitHub
1. Ve a https://github.com
2. Haz clic en "New repository"
3. Nombre: `keycloak-oidc-auth-server`
4. Haz clic en "Create repository"

### 1.3 Subir el código
```bash
git branch -M main
git remote add origin https://github.com/TU-USUARIO/keycloak-oidc-auth-server.git
git push -u origin main
```

## Paso 2: Desplegar en Railway

### 2.1 Crear cuenta en Railway
1. Ve a https://railway.app
2. Haz clic en "Login"
3. Selecciona "Login with GitHub"
4. Autoriza Railway a acceder a tus repositorios

### 2.2 Crear nuevo proyecto
1. En el dashboard de Railway, haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona tu repositorio `keycloak-oidc-auth-server`
4. Haz clic en "Deploy Now"

### 2.3 Configuración automática
Railway detectará automáticamente:
- ✅ Es un proyecto Node.js
- ✅ Usará `npm install` para instalar dependencias
- ✅ Usará `npm start` para ejecutar
- ✅ Puerto será asignado automáticamente

### 2.4 Obtener la URL
Una vez desplegado, Railway te dará una URL como:
`https://keycloak-oidc-auth-server-production.up.railway.app`

## Paso 3: Configurar en Keycloak Cloud

### 3.1 Crear Identity Provider
1. Ve a tu Keycloak Cloud
2. Ve a **Identity Providers** → **Add provider** → **OpenID Connect v1.0**

### 3.2 Configurar URLs
Usa la URL de Railway en estos campos:
- **Alias**: `oidc-hono-provider`
- **Display Name**: `OIDC Hono Provider`
- **Authorization URL**: `https://tu-proyecto-production.up.railway.app/authorize`
- **Token URL**: `https://tu-proyecto-production.up.railway.app/token`
- **User Info URL**: `https://tu-proyecto-production.up.railway.app/userinfo`
- **Client ID**: `keycloak-client`
- **Client Secret**: (dejar vacío)

### 3.3 Configurar Discovery
- **Discovery Endpoint**: `https://tu-proyecto-production.up.railway.app/.well-known/openid-configuration`
- **Validate Signature**: `Off`

### 3.4 Mapeo de atributos
Agregar estos mappers:
- **username**: `preferred_username`
- **email**: `email`
- **firstName**: `given_name`
- **lastName**: `family_name`

## Paso 4: Probar la integración

### 4.1 Verificar que el servidor funciona
```bash
curl https://tu-proyecto-production.up.railway.app/.well-known/openid-configuration
```

### 4.2 Probar el flujo completo
1. En Keycloak, ve a tu aplicación
2. Haz clic en "Login with oidc-hono-provider"
3. Usa las credenciales:
   - **Email**: `hortiz@libelulasoft.com`
   - **Password**: `baLexI`

## ⚠️ Limitaciones del Free Tier de Railway

- **Se duerme** después de 5 minutos de inactividad
- **Tarda unos segundos** en despertar
- **$5 de crédito mensual** (suficiente para pruebas)

## 🔧 Solución de problemas

### Error: "Service unavailable"
- El servicio se durmió, espera unos segundos y vuelve a intentar

### Error: "Invalid redirect_uri"
- Verifica que la URL en Keycloak coincida exactamente con la de Railway

### Error: "Discovery failed"
- Verifica que la URL del discovery endpoint sea correcta

## 📱 Monitoreo

En Railway puedes ver:
- ✅ Logs en tiempo real
- ✅ Uso de recursos
- ✅ Estado del servicio
- ✅ Métricas de rendimiento
