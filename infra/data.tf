# Lê a URL pública da API Rails, publicada pelo repositório `api` após o
# deploy do Service (ELB) — este repo depende do `api` já ter sido implantado.
data "aws_ssm_parameter" "rails_api_base_url" {
  name = "/oficina-mecanica/rails_api_base_url"
}
