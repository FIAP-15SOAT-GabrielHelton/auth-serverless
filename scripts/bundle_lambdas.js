// Empacota cada handler num único arquivo CJS (deps inlined via esbuild),
// evitando ter que enviar node_modules dentro do zip da Lambda.
const esbuild = require("esbuild");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HANDLERS = ["auth_customer", "lambda_authorizer"];

esbuild.buildSync({
  entryPoints: HANDLERS.map((name) => path.join(ROOT, "src", "handlers", `${name}.ts`)),
  outdir: path.join(ROOT, "dist"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  minify: false,
  sourcemap: false,
});

console.log("Lambdas empacotadas em dist/*.js");
