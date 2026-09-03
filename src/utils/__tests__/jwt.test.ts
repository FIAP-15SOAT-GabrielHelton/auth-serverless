import jwt from "jsonwebtoken";
import { verifyAccessToken, extractBearerToken } from "../jwt";

describe("verifyAccessToken", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, JWT_SECRET: "test_secret" };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("decodifica um token válido assinado com o mesmo segredo", () => {
    const token = jwt.sign({ sub: 2, role: "customer", type: "customer_access" }, "test_secret", {
      algorithm: "HS256",
    });

    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(2);
    expect(decoded.role).toBe("customer");
  });

  it("lança erro para token com assinatura inválida", () => {
    const token = jwt.sign({ sub: 2, role: "customer", type: "customer_access" }, "wrong_secret", {
      algorithm: "HS256",
    });

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("lança erro para token expirado", () => {
    const token = jwt.sign(
      { sub: 2, role: "customer", type: "customer_access" },
      "test_secret",
      { algorithm: "HS256", expiresIn: -10 }
    );

    expect(() => verifyAccessToken(token)).toThrow();
  });
});

describe("extractBearerToken", () => {
  it("extrai o token de um header Bearer válido", () => {
    expect(extractBearerToken("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("retorna null quando não há header", () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
  });

  it("retorna null quando o header não é Bearer", () => {
    expect(extractBearerToken("Basic abc123")).toBeNull();
  });
});
