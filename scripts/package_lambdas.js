// Empacota cada bundle (dist/*.js) num zip próprio para o Terraform
// (infra/main.tf) fazer o upload dos aws_lambda_function via `filename`.
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const HANDLERS = ["auth_customer", "lambda_authorizer"];

fs.mkdirSync(path.join(ROOT, "build"), { recursive: true });

for (const name of HANDLERS) {
  const zipPath = path.join(ROOT, "build", `${name}.zip`);
  fs.rmSync(zipPath, { force: true });

  execSync(`zip -j "${zipPath}" "${name}.js"`, { cwd: DIST, stdio: "inherit" });

  console.log(`Empacotado ${zipPath}`);
}
