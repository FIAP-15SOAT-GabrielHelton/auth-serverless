import { isValidCpf, normalizeCpf } from "../cpf_validator";

describe("isValidCpf", () => {
  it("aceita um CPF válido formatado", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("aceita um CPF válido apenas com dígitos", () => {
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejeita CPF com dígito verificador incorreto", () => {
    expect(isValidCpf("52998224726")).toBe(false);
  });

  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(isValidCpf("11111111111")).toBe(false);
  });

  it("rejeita CPF com tamanho incorreto", () => {
    expect(isValidCpf("123456789")).toBe(false);
  });

  it("rejeita valores vazios ou nulos", () => {
    expect(isValidCpf("")).toBe(false);
    expect(isValidCpf(undefined)).toBe(false);
    expect(isValidCpf(null)).toBe(false);
  });
});

describe("normalizeCpf", () => {
  it("remove pontuação, mantendo só os dígitos", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
  });
});
