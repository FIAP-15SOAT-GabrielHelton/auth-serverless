import type { AccessTokenPayload } from "./jwt";

export interface AuthorizerPolicy {
  principalId: string;
  policyDocument: {
    Version: "2012-10-17";
    Statement: Array<{
      Action: "execute-api:Invoke";
      Effect: "Allow" | "Deny";
      Resource: string;
    }>;
  };
  context: {
    userId: string;
    role: string;
    type: string;
    cpf: string;
  };
}

export function allowPolicy(resource: string, decoded: AccessTokenPayload): AuthorizerPolicy {
  return buildPolicy(resource, "Allow", decoded);
}

export function denyPolicy(resource: string): AuthorizerPolicy {
  return buildPolicy(resource, "Deny", {
    sub: "unauthorized",
    role: "",
    type: "",
  });
}

function buildPolicy(
  resource: string,
  effect: "Allow" | "Deny",
  decoded: AccessTokenPayload
): AuthorizerPolicy {
  return {
    principalId: String(decoded.sub),
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: {
      userId: String(decoded.sub),
      role: decoded.role ?? "customer",
      type: decoded.type ?? "",
      cpf: decoded.cpf ?? "",
    },
  };
}
