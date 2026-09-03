import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  sub: string | number;
  role: string;
  type: string;
  cpf?: string;
  email?: string;
  [key: string]: unknown;
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

/**
 * Verifica a assinatura (HS256) e a expiração do token.
 * Precisa usar o mesmo segredo configurado em Auth::JwtEncoder na API Rails.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, jwtSecret(), { algorithms: ["HS256"] }) as AccessTokenPayload;
}

export function extractBearerToken(authHeader: string | undefined | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  return match ? match[1] : null;
}
