import { postToRails } from "../../clients/rails_client";
import { authenticateCustomer } from "../auth_customer";

jest.mock("../../clients/rails_client");

const mockedPostToRails = postToRails as jest.MockedFunction<typeof postToRails>;

describe("authenticateCustomer", () => {
  beforeEach(() => {
    mockedPostToRails.mockReset();
  });

  it("retorna 422 sem chamar a API Rails quando o CPF é inválido", async () => {
    const result = await authenticateCustomer("123");

    expect(result.statusCode).toBe(422);
    expect(result.body).toEqual({ error: "Invalid CPF" });
    expect(mockedPostToRails).not.toHaveBeenCalled();
  });

  it("repassa 200 e o token quando a API Rails autentica com sucesso", async () => {
    mockedPostToRails.mockResolvedValue({
      status: 200,
      body: { access_token: "jwt.token.here", customer: { id: 2, name: "Maria Souza" } },
    });

    const result = await authenticateCustomer("529.982.247-25");

    expect(mockedPostToRails).toHaveBeenCalledWith("/api/v1/auth/customer", { cpf: "52998224725" });
    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({ access_token: "jwt.token.here" });
  });

  it("repassa 401 quando o cliente não existe ou está inativo", async () => {
    mockedPostToRails.mockResolvedValue({ status: 401, body: { error: "Customer not found" } });

    const result = await authenticateCustomer("52998224725");

    expect(result.statusCode).toBe(401);
    expect(result.body).toEqual({ error: "Customer not found" });
  });
});
