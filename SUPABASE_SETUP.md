# Configuración de Supabase

Este proyecto requiere configuración de Supabase para consultar la tabla `user` y obtener información del usuario autenticado.

## Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# Configuración de Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-aqui

# Puerto del servidor (opcional, por defecto 3000)
PORT=3000
```

## Obtener Credenciales de Supabase

1. Ve a tu panel de Supabase: https://app.supabase.com/project/[tu-proyecto]/settings/api
2. Copia la **Project URL** y úsala como `SUPABASE_URL`
3. Copia la **anon public** key y úsala como `SUPABASE_ANON_KEY`

## Estructura de la Tabla User

El servicio espera que la tabla `user` tenga la siguiente estructura:

```sql
create table public.user (
  id uuid not null default gen_random_uuid (),
  full_name character varying not null,
  enabled boolean null default true,
  email text not null,
  company_id uuid null,
  role public.user_role not null default 'user'::user_role,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_pkey primary key (id),
  constraint user_email_key unique (email),
  constraint user_company_id_fkey foreign KEY (company_id) references company (id) on delete set null,
  constraint user_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
```

## Mapeo de Datos

El servicio mapea automáticamente los datos de Supabase al formato OIDC:

- `id` → `sub` (subject identifier)
- `full_name` → `name` y se divide en `given_name` y `family_name`
- `email` → `email`
- `role` → `role` (campo adicional)
- `company_id` → `company_id` (campo adicional)
- `enabled` → `enabled` (campo adicional)

## Flujo de Autenticación

1. Usuario ingresa credenciales
2. Se valida contra el endpoint externo de login
3. Se valida el access token contra el endpoint de validación
4. Se consulta el usuario en Supabase por email
5. Se mapean los datos de Supabase al formato OIDC
6. Se generan los tokens JWT con los datos del usuario

## Políticas de Seguridad

Asegúrate de configurar las políticas RLS (Row Level Security) en Supabase para la tabla `user`:

```sql
-- Habilitar RLS
ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura por email (ajusta según tus necesidades)
CREATE POLICY "Allow read by email" ON public.user
  FOR SELECT USING (true);
```
