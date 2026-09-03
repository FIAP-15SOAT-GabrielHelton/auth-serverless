import express from "express";
import { authenticateCustomer } from "./handlers/auth_customer";
import { verifyAccessToken, extractBearerToken } from "./utils/jwt";

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.post("/auth/customer", async (req, res) => {
  const result = await authenticateCustomer(req.body?.cpf ?? req.body?.document);
  res.status(result.statusCode).json(result.body);
});

// Endpoint auxiliar só para inspecionar localmente o resultado do Lambda
// Authorizer (o API Gateway real nunca expõe isso como rota HTTP).
app.get("/authorize/inspect", (req, res) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const decoded = verifyAccessToken(token);
    res.json({ allow: true, context: decoded });
  } catch (err) {
    res.status(401).json({ allow: false, error: (err as Error).message });
  }
});

app.get("/up", (_req, res) => res.status(200).send("ok"));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`auth-serverless local server listening on :${PORT}`);
});
