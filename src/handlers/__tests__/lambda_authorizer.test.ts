import jwt from "jsonwebtoken";
import { handler } from "../lambda_authorizer";

describe("lambda_authorizer handler", () => {
  const OLD_ENV = process.env;
  const ROUTE_ARN = "arn:aws:execute-api:us-east-1:123456789012:abc123/$default/GET/api/v1/work_orders";

  beforeEach(() => {
    process.env = { ...OLD_ENV, JWT_SECRET: "test_secret" };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("permite acesso (Allow) para token válido e injeta o contexto", async () => {
    const token = jwt.sign(
      { sub: 2, role: "customer", type: "customer_access", cpf: "52998224725" },
      "test_secret",
      { algorithm: "HS256" }
    );

    const result = await handler({
      headers: { authorization: `Bearer ${token}` },
      routeArn: ROUTE_ARN,
    });

    expect(result.policyDocument.Statement[0].Effect).toBe("Allow");
    expect(result.context).toMatchObject({ userId: "2", role: "customer", cpf: "52998224725" });
  });

  it("nega acesso (Deny) quando não há header Authorization", async () => {
    const result = await handler({ routeArn: ROUTE_ARN });
    expect(result.policyDocument.Statement[0].Effect).toBe("Deny");
  });

  it("nega acesso (Deny) para token com assinatura inválida", async () => {
    const token = jwt.sign({ sub: 2, role: "customer", type: "customer_access" }, "wrong_secret", {
      algorithm: "HS256",
    });

    const result = await handler({
      headers: { authorization: `Bearer ${token}` },
      routeArn: ROUTE_ARN,
    });

    expect(result.policyDocument.Statement[0].Effect).toBe("Deny");
  });

  it("nega acesso (Deny) para token expirado", async () => {
    const token = jwt.sign({ sub: 2, role: "customer", type: "customer_access" }, "test_secret", {
      algorithm: "HS256",
      expiresIn: -10,
    });

    const result = await handler({
      headers: { authorization: `Bearer ${token}` },
      routeArn: ROUTE_ARN,
    });

    expect(result.policyDocument.Statement[0].Effect).toBe("Deny");
  });
});
