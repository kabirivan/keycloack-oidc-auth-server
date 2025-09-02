import { Hono } from 'hono';
import { config } from '../config.js';
import CryptoJS from 'crypto-js';

const jwks = new Hono();

// Generar clave JWK desde la clave secreta
function generateJWK() {
  // Convertir la clave secreta a bytes
  const keyBytes = CryptoJS.enc.Utf8.parse(config.jwtSecret);
  
  // Generar hash SHA-256 de la clave
  const keyHash = CryptoJS.SHA256(keyBytes);
  
  // Convertir a base64url
  const keyBase64 = CryptoJS.enc.Base64.stringify(keyHash)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Generar JWK
  const jwk = {
    kty: 'oct', // Key Type: Octet sequence
    use: 'sig', // Public Key Use: signature
    kid: 'key-1', // Key ID
    alg: 'HS256', // Algorithm
    k: keyBase64 // Key value (base64url encoded)
  };

  return jwk;
}

// Endpoint GET /jwks - Retorna las claves JWK
jwks.get('/jwks', (c) => {
  const jwk = generateJWK();
  
  const jwksResponse = {
    keys: [jwk]
  };

  return c.json(jwksResponse);
});

export default jwks;
