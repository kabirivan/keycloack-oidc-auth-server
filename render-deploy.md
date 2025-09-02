# Despliegue en Render

Render es otra excelente opción con tier gratuito.

## Pasos:

### 1. Preparar el proyecto
```bash
# Crear archivo render.yaml
echo 'services:
  - type: web
    name: oidc-provider
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000' > render.yaml
```

### 2. Creectar con Render
- Ve a https://render.com
- Conecta tu GitHub
- Selecciona este repositorio
- Render detectará automáticamente la configuración

### 3. Configurar
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: `Node`

### 4. Obtener URL
- Render te dará una URL como: `https://tu-proyecto.onrender.com`
- Actualiza la configuración en `src/config.ts`
