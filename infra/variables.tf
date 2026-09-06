variable "jwt_secret" {
  description = "Segredo HS256 compartilhado com Auth::JwtEncoder na API Rails"
  type        = string
  sensitive   = true
}

variable "new_relic_license_key" {
  description = "Ingest License Key da conta New Relic (agente/extensão nas Lambdas)"
  type        = string
  sensitive   = true
}

variable "new_relic_account_id" {
  description = "Account ID da conta New Relic"
  type        = string
}

# ARN da Lambda Layer do agente New Relic para Node.js 20.x (região us-east-1).
# Versão mais recente disponível em:
# https://us-east-1.layers.newrelic-external.com/get-layers?CompatibleRuntime=nodejs20.x
variable "newrelic_lambda_layer_arn" {
  description = "ARN da Lambda Layer do New Relic (Node.js 20.x, us-east-1)"
  type        = string
  default     = "arn:aws:lambda:us-east-1:451483290750:layer:NewRelicNodeJS20X:124"
}
