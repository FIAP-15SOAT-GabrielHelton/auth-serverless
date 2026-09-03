variable "jwt_secret" {
  description = "Segredo HS256 compartilhado com Auth::JwtEncoder na API Rails"
  type        = string
  sensitive   = true
}
