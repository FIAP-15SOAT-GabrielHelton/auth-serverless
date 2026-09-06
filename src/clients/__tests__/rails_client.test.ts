import { postToRails } from "../rails_client";

describe("postToRails", () => {
  const originalEnv = process.env.RAILS_API_BASE_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.RAILS_API_BASE_URL = "http://rails.internal";
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env.RAILS_API_BASE_URL = originalEnv;
    global.fetch = originalFetch;
  });

  it("does not send X-Request-Id when no correlationId is given", async () => {
    await postToRails("/api/v1/auth/customer", { cpf: "52998224725" });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers).not.toHaveProperty("X-Request-Id");
  });

  it("forwards the correlationId as X-Request-Id, to correlate with the Rails API and CloudWatch/New Relic logs", async () => {
    await postToRails("/api/v1/auth/customer", { cpf: "52998224725" }, "req-abc-123");

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://rails.internal/api/v1/auth/customer");
    expect(options.headers).toMatchObject({ "X-Request-Id": "req-abc-123" });
  });
});
