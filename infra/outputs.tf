output "api_gateway_url" {
  description = "URL pública do API Gateway — única porta de entrada do sistema"
  value       = aws_apigatewayv2_stage.default.invoke_url
}
