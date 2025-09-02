import { Hono } from 'hono';
import { config } from '../config.js';

const wellKnown = new Hono();

// Endpoint de descubrimiento OIDC
wellKnown.get('/.well-known/openid-configuration', (c) => {
  const discovery = {
    issuer: config.oidc.issuer,
    authorization_endpoint: config.oidc.authorization_endpoint,
    token_endpoint: config.oidc.token_endpoint,
    userinfo_endpoint: config.oidc.userinfo_endpoint,
    jwks_uri: config.oidc.jwks_uri,
    response_types_supported: config.oidc.response_types_supported,
    grant_types_supported: config.oidc.grant_types_supported,
    subject_types_supported: config.oidc.subject_types_supported,
    id_token_signing_alg_values_supported: config.oidc.id_token_signing_alg_values_supported,
    token_endpoint_auth_methods_supported: config.oidc.token_endpoint_auth_methods_supported,
    scopes_supported: config.oidc.scopes_supported,
    claims_supported: config.oidc.claims_supported,
    code_challenge_methods_supported: ['S256', 'plain'],
    response_modes_supported: ['query', 'fragment', 'form_post']
  };

  return c.json(discovery);
});

export default wellKnown;
