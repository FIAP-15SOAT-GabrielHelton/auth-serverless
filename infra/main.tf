locals {
  lab_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
}

resource "aws_lambda_function" "auth_customer" {
  function_name = "oficina-mecanica-auth-customer"
  role          = local.lab_role_arn
  handler       = "auth_customer.handler"
  runtime       = "nodejs20.x"
  timeout       = 10

  filename         = "${path.module}/../build/auth_customer.zip"
  source_code_hash = filebase64sha256("${path.module}/../build/auth_customer.zip")

  environment {
    variables = {
      RAILS_API_BASE_URL = data.aws_ssm_parameter.rails_api_base_url.value
    }
  }
}

resource "aws_lambda_function" "lambda_authorizer" {
  function_name = "oficina-mecanica-lambda-authorizer"
  role          = local.lab_role_arn
  handler       = "lambda_authorizer.handler"
  runtime       = "nodejs20.x"
  timeout       = 5

  filename         = "${path.module}/../build/lambda_authorizer.zip"
  source_code_hash = filebase64sha256("${path.module}/../build/lambda_authorizer.zip")

  environment {
    variables = {
      JWT_SECRET = var.jwt_secret
    }
  }
}

resource "aws_lambda_permission" "apigw_invoke_auth_customer" {
  statement_id  = "AllowAPIGatewayInvokeAuthCustomer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_customer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_invoke_authorizer" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
