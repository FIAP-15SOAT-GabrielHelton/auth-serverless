locals {
  lab_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
}

resource "aws_lambda_function" "auth_customer" {
  function_name = "oficina-mecanica-auth-customer"
  role          = local.lab_role_arn
  handler       = "newrelic-lambda-wrapper.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  layers        = [var.newrelic_lambda_layer_arn]

  filename         = "${path.module}/../build/auth_customer.zip"
  source_code_hash = filebase64sha256("${path.module}/../build/auth_customer.zip")

  environment {
    variables = {
      RAILS_API_BASE_URL       = data.aws_ssm_parameter.rails_api_base_url.value
      NEW_RELIC_LAMBDA_HANDLER = "auth_customer.handler"
      NEW_RELIC_ACCOUNT_ID     = var.new_relic_account_id
      NEW_RELIC_LICENSE_KEY    = var.new_relic_license_key
    }
  }
}

resource "aws_lambda_function" "lambda_authorizer" {
  function_name = "oficina-mecanica-lambda-authorizer"
  role          = local.lab_role_arn
  handler       = "newrelic-lambda-wrapper.handler"
  runtime       = "nodejs20.x"
  timeout       = 5
  layers        = [var.newrelic_lambda_layer_arn]

  filename         = "${path.module}/../build/lambda_authorizer.zip"
  source_code_hash = filebase64sha256("${path.module}/../build/lambda_authorizer.zip")

  environment {
    variables = {
      JWT_SECRET               = var.jwt_secret
      NEW_RELIC_LAMBDA_HANDLER = "lambda_authorizer.handler"
      NEW_RELIC_ACCOUNT_ID     = var.new_relic_account_id
      NEW_RELIC_LICENSE_KEY    = var.new_relic_license_key
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
