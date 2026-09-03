# auth-serverless

Serviço serverless (AWS Lambda + API Gateway) de autenticação de clientes via CPF e autorização (RBAC) do projeto **Oficina Mecânica** — Fase 3 do Tech Challenge FIAP.

Arquitetura completa e decisões (ADRs) na [RFC-001](https://github.com/FIAP-15SOAT-GabrielHelton/api/blob/main/docs/fase3/RFC-001-authentication-authorization-serverless.md), do repositório [`api`](https://github.com/FIAP-15SOAT-GabrielHelton/api).

Este repositório faz parte de um conjunto de 5:

| Repositório | Responsabilidade |
| :--- | :--- |
| [`k8s-infra`](https://github.com/FIAP-15SOAT-GabrielHelton/k8s-infra) | VPC + EKS + node group |
| [`db-infra`](https://github.com/FIAP-15SOAT-GabrielHelton/db-infra) | RDS PostgreSQL |
| [`api`](https://github.com/FIAP-15SOAT-GabrielHelton/api) | Aplicação Rails + ECR + deploy no cluster |
| `auth-serverless` (este repo) | API Gateway + Lambdas de autenticação/RBAC |
| [`deploy-orchestrator`](https://github.com/FIAP-15SOAT-GabrielHelton/deploy-orchestrator) | Dispara e aguarda o deploy dos 4 repos acima, em ordem |

## O que tem aqui

- **`auth_customer` (Lambda, `AWS_PROXY`)** — `POST /api/v1/auth/customer`: valida o formato do CPF (Módulo 11) e delega à API Rails (Single Source of Truth) a existência/status do cliente e a emissão do JWT. Rota pública, sem authorizer.
- **`lambda_authorizer` (Lambda, `REQUEST`)** — valida a assinatura (HS256) e expiração do JWT usando o mesmo segredo do `Auth::JwtEncoder` da API Rails, e injeta `{ userId, role, type, cpf }` no contexto repassado ao backend. Não decide RBAC por rota — isso é responsabilidade da API Rails (defesa em profundidade).
- **API Gateway (HTTP API v2)** — única porta de entrada pública do sistema. Rotas públicas (`/auth/login`, `/up`, `/tracking/{protocol}`, `/webhooks/{proxy+}`, `/auth/customer`) fazem `HTTP_PROXY` direto ao ELB público da API Rails (sem VPC Link — ver ADR 5 da RFC-001); a rota protegida `ANY /api/v1/{proxy+}` passa pelo `lambda_authorizer`.

## Desenvolvimento local

```bash
docker compose up --build
```

Sobe o servidor local (Express, porta `3001`) simulando o comportamento das rotas do API Gateway, apontando para uma API Rails rodando em `http://host.docker.internal:3000` (`rails s -p 3000` no repositório `api`).

```bash
curl -X POST http://localhost:3001/auth/customer \
  -H "Content-Type: application/json" \
  -d '{"cpf": "52998224725"}'
```

Cenários esperados: CPF válido e cliente ativo → `200` com `access_token`; CPF com formato/dígitos inválidos → `422`; cliente inexistente ou inativo → `401` (repassado da API Rails).

Sem Docker:

```bash
npm install
npm run dev       # servidor local, porta 3001 (lê PORT/JWT_SECRET/RAILS_API_BASE_URL do ambiente)
npm test          # Jest
npm run typecheck # tsc --noEmit
npm run lint      # eslint
```

## Deploy

Workflow `CD Deploy (Lambdas & API Gateway)` (`workflow_dispatch`): builda os handlers (esbuild, um bundle por Lambda) e provisiona via Terraform. Recebe as credenciais temporárias da sessão do AWS Academy.

**Pré-requisito:** o repositório `api` precisa ter sido implantado antes (publica `/oficina-mecanica/rails_api_base_url` no SSM Parameter Store, que este repositório lê).

**Ordem de deploy do projeto**: `k8s-infra → db-infra → api → auth-serverless` (este repo, por último), ou use o [`deploy-orchestrator`](https://github.com/FIAP-15SOAT-GabrielHelton/deploy-orchestrator).

### Configuração necessária

Secret do repositório: `JWT_SECRET` — **precisa ser exatamente o mesmo valor** usado pela API Rails (`SECRET_KEY_BASE`/`JWT_SECRET` no repositório `api`), já que o `lambda_authorizer` verifica a assinatura HS256 dos tokens emitidos pelo `Auth::JwtEncoder` do Rails.

## Destroy

Workflow `CD Destroy (Lambdas & API Gateway)`.
