import { verifyAccessToken, extractBearerToken } from "../utils/jwt";
import { allowPolicy, denyPolicy, type AuthorizerPolicy } from "../utils/policy_generator";
import { logger } from "../utils/logger";

interface AuthorizerEvent {
  headers?: Record<string, string | undefined>;
  routeArn?: string;
  methodArn?: string;
  requestContext?: { requestId?: string };
}

/**
 * Lambda Authorizer (REQUEST) do API Gateway: valida a assinatura e a
 * expiração do JWT (mesmo segredo HS256 do Auth::JwtEncoder na API Rails) e
 * injeta claims (role, userId, cpf) no contexto encaminhado para o backend.
 * Não decide RBAC por rota — isso é responsabilidade da API Rails
 * (defesa em profundidade, ADR 2 da RFC-001).
 */
export const handler = async (event: AuthorizerEvent): Promise<AuthorizerPolicy> => {
  const requestId = event.requestContext?.requestId;
  const resource = event.routeArn ?? event.methodArn ?? "*";
  const authHeader = event.headers?.authorization ?? event.headers?.Authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    logger.warn("Authorization denied: missing bearer token", { requestId, resource });
    return denyPolicy(resource);
  }

  try {
    const decoded = verifyAccessToken(token);
    logger.info("Authorization granted", { requestId, resource, role: decoded.role, userId: decoded.sub });
    return allowPolicy(resource, decoded);
  } catch (error) {
    logger.warn("Authorization denied: invalid or expired token", {
      requestId,
      resource,
      error: error instanceof Error ? error.message : String(error),
    });
    return denyPolicy(resource);
  }
};
