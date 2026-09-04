import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { isValidCpf, normalizeCpf } from "../utils/cpf_validator";
import { postToRails } from "../clients/rails_client";

interface AuthenticateCustomerResult {
  statusCode: number;
  body: unknown;
}

/**
 * Orquestra a autenticação de cliente por CPF: valida o formato localmente
 * (fail fast) e delega a existência/status do cliente e a emissão do JWT
 * para a API Rails (Single Source of Truth), conforme ADR 1 da RFC-001.
 */
export async function authenticateCustomer(cpf: string | undefined): Promise<AuthenticateCustomerResult> {
  if (!isValidCpf(cpf)) {
    return { statusCode: 422, body: { error: "Invalid CPF" } };
  }

  const rails = await postToRails("/api/v1/auth/customer", { cpf: normalizeCpf(cpf as string) });
  return { statusCode: rails.status, body: rails.body };
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  let cpf: string | undefined;
  try {
    const parsed = event.body ? JSON.parse(event.body) : {};
    cpf = parsed.cpf ?? parsed.document;
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Malformed JSON body" }),
    };
  }

  const result = await authenticateCustomer(cpf);
  return {
    statusCode: result.statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result.body),
  };
};
