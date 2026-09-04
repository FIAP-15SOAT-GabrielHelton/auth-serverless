locals {
  rails_api_base_url = data.aws_ssm_parameter.rails_api_base_url.value
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "oficina-mecanica-apigw"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# --- Lambda Authorizer (REQUEST, IAM policy) ---
# Valida o JWT na borda; a decisão de RBAC por rota é feita pela API Rails
# (defesa em profundidade — ADR 2 da RFC-001).
resource "aws_apigatewayv2_authorizer" "jwt_authorizer" {
  api_id                            = aws_apigatewayv2_api.http_api.id
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.lambda_authorizer.invoke_arn
  authorizer_payload_format_version = "1.0"
  identity_sources                  = ["$request.header.Authorization"]
  name                              = "lambda-jwt-authorizer"
}

# --- Integração pública: Lambda de autenticação de cliente ---
resource "aws_apigatewayv2_integration" "auth_customer" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.auth_customer.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "auth_customer" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/v1/auth/customer"
  target    = "integrations/${aws_apigatewayv2_integration.auth_customer.id}"
}

# --- Integrações públicas: HTTP Proxy direto ao ELB da API Rails (sem VPC Link — ADR 5) ---
resource "aws_apigatewayv2_integration" "rails_auth_login" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "POST"
  integration_uri        = "${local.rails_api_base_url}/api/v1/auth/login"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "rails_auth_login" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/v1/auth/login"
  target    = "integrations/${aws_apigatewayv2_integration.rails_auth_login.id}"
}

resource "aws_apigatewayv2_integration" "rails_health" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "GET"
  integration_uri        = "${local.rails_api_base_url}/up"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "rails_health" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /up"
  target    = "integrations/${aws_apigatewayv2_integration.rails_health.id}"
}

resource "aws_apigatewayv2_integration" "rails_tracking" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "GET"
  integration_uri        = "${local.rails_api_base_url}/api/v1/tracking/{protocol}"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "rails_tracking" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/v1/tracking/{protocol}"
  target    = "integrations/${aws_apigatewayv2_integration.rails_tracking.id}"
}

resource "aws_apigatewayv2_integration" "rails_webhooks" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "PATCH"
  integration_uri        = "${local.rails_api_base_url}/api/v1/webhooks/{proxy}"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "rails_webhooks" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "PATCH /api/v1/webhooks/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.rails_webhooks.id}"
}

# --- Integração protegida: ANY /api/v1/{proxy+}, com Lambda Authorizer ---
resource "aws_apigatewayv2_integration" "rails_protected" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "ANY"
  integration_uri        = "${local.rails_api_base_url}/api/v1/{proxy}"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "rails_protected" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "ANY /api/v1/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.rails_protected.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
}
