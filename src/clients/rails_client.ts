export interface RailsResponse {
  status: number;
  body: unknown;
}

function railsApiBaseUrl(): string {
  const url = process.env.RAILS_API_BASE_URL;
  if (!url) {
    throw new Error("RAILS_API_BASE_URL environment variable is not set");
  }
  return url.replace(/\/+$/, "");
}

/**
 * Cliente HTTP fino para a API Rails interna (Single Source of Truth de domínio).
 * correlationId (o requestId do API Gateway) é propagado como X-Request-Id para
 * que a mesma requisição seja rastreável nos logs/traces dos dois lados.
 */
export async function postToRails(
  path: string,
  payload: unknown,
  correlationId?: string
): Promise<RailsResponse> {
  const response = await fetch(`${railsApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(correlationId ? { "X-Request-Id": correlationId } : {}),
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}
