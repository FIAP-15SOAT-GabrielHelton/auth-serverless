import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { isValidCpf, normalizeCpf } from "../utils/cpf_validator";
import { postToRails } from "../clients/rails_client";
import { logger } from "../utils/logger";

interface AuthenticateCustomerResult {
  statusCode: number;
  body: unknown;
}

/**
 * Orquestra a autenticação de cliente por CPF: valida o formato localmente
 * (fail fast) e delega a existência/status do cliente e a emissão do JWT
 * para a API Rails (Single Source of Truth), conforme ADR 1 da RFC-001.
 */
export async function authenticateCustomer(
  cpf: string | undefined,
  correlationId?: string
): Promise<AuthenticateCustomerResult> {
  if (!isValidCpf(cpf)) {
    return { statusCode: 422, body: { error: "Invalid CPF" } };
  }

  const rails = await postToRails(
    "/api/v1/auth/customer",
    { cpf: normalizeCpf(cpf as string) },
    correlationId
  );
  return { statusCode: rails.status, body: rails.body };
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const correlationId = event.requestContext?.requestId;

  let cpf: string | undefined;
  try {
    const parsed = event.body ? JSON.parse(event.body) : {};
    cpf = parsed.cpf ?? parsed.document;
  } catch {
    logger.warn("Malformed JSON body", { requestId: correlationId });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Malformed JSON body" }),
    };
  }

  const result = await authenticateCustomer(cpf, correlationId);
  if (result.statusCode >= 500) {
    logger.error("Customer authentication failed", { requestId: correlationId, statusCode: result.statusCode });
  } else {
    logger.info("Customer authentication processed", { requestId: correlationId, statusCode: result.statusCode });
  }

  return {
    statusCode: result.statusCode,
    headers: { "Content-Type": "application/json", "X-Request-Id": correlationId ?? "" },
    body: JSON.stringify(result.body),
  };
};
