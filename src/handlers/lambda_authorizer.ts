import { verifyAccessToken, extractBearerToken } from "../utils/jwt";
import { allowPolicy, denyPolicy, type AuthorizerPolicy } from "../utils/policy_generator";

interface AuthorizerEvent {
  headers?: Record<string, string | undefined>;
  routeArn?: string;
  methodArn?: string;
}

/**
 * Lambda Authorizer (REQUEST) do API Gateway: valida a assinatura e a
 * expiração do JWT (mesmo segredo HS256 do Auth::JwtEncoder na API Rails) e
 * injeta claims (role, userId, cpf) no contexto encaminhado para o backend.
 * Não decide RBAC por rota — isso é responsabilidade da API Rails
 * (defesa em profundidade, ADR 2 da RFC-001).
 */
export const handler = async (event: AuthorizerEvent): Promise<AuthorizerPolicy> => {
  const resource = event.routeArn ?? event.methodArn ?? "*";
  const authHeader = event.headers?.authorization ?? event.headers?.Authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return denyPolicy(resource);
  }

  try {
    const decoded = verifyAccessToken(token);
    return allowPolicy(resource, decoded);
  } catch {
    return denyPolicy(resource);
  }
};
