import { z } from 'zod';

// Schemas de validación con Zod
export const LoginRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password requerido')
});

export const TokenValidationSchema = z.object({
  token: z.string().min(1, 'Token requerido')
});

export const TokenExchangeRequestSchema = z.object({
  legacyToken: z.string().min(1, 'Token legacy requerido')
});

// Tipos TypeScript derivados de los schemas
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type TokenValidation = z.infer<typeof TokenValidationSchema>;
export type TokenExchangeRequest = z.infer<typeof TokenExchangeRequestSchema>;

// Interfaces para respuestas
export interface LegacyUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface LegacyTokenPayload {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  iat: number;
  exp: number;
}

export interface KeycloakTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthFlowResponse {
  success: boolean;
  message: string;
  data?: {
    supabaseSession: any;
    keycloakTokens: KeycloakTokenResponse;
  };
  error?: string;
}

// Códigos de error personalizados
export enum AuthErrorCodes {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  KEYCLOAK_ERROR = 'KEYCLOAK_ERROR',
  USER_NOT_FOUND_IN_SUPABASE = 'USER_NOT_FOUND_IN_SUPABASE',
  SUPABASE_ERROR = 'SUPABASE_ERROR'
}
