# Define all hardcoded local variable and local variables looked up from data resources
locals {
  stack_name                = "filing-create" # this must match the stack name the service deploys into
  name_prefix               = "${local.stack_name}-${var.environment}"
  service_name              = "extensions-web"
  container_port            = "3000" # default node port required here until prod docker container is built allowing port change via env var
  docker_repo               = "extensions-web"
  lb_listener_rule_priority = 91
  lb_listener_paths         = ["/extensions/*"]
  healthcheck_path          = "/extensions/healthcheck" #healthcheck path for extensions web
  healthcheck_matcher       = "200"

  service_secrets           = jsondecode(data.vault_generic_secret.service_secrets.data_json)

  parameter_store_secrets    = {
    "vpc_name"                  = local.service_secrets["vpc_name"]
    "chs_api_key"               = local.service_secrets["chs_api_key"]
    "internal_api_url"          = local.service_secrets["internal_api_url"]
    "oauth2_auth_uri"           = local.service_secrets["oauth2_auth_uri"]
    "oauth2_redirect_uri"       = local.service_secrets["oauth2_redirect_uri"]
    "account_test_url"          = local.service_secrets["account_test_url"]
    "account_url"               = local.service_secrets["account_url"]
    "cache_server"              = local.service_secrets["cache_server"]
    "oauth2_client_id"          = local.service_secrets["oauth2_client_id"]
    "oauth2_client_secret"      = local.service_secrets["oauth2_client_secret"]
    "payments_api_url"          = local.service_secrets["payments_api_url"]
  }

  vpc_name                  = local.service_secrets["vpc_name"]
  chs_api_key               = local.service_secrets["chs_api_key"]
  internal_api_url          = local.service_secrets["internal_api_url"]
  oauth2_auth_uri           = local.service_secrets["oauth2_auth_uri"]
  oauth2_redirect_uri       = local.service_secrets["oauth2_redirect_uri"]
  account_test_url          = local.service_secrets["account_test_url"]
  account_url               = local.service_secrets["account_url"]
  cache_server              = local.service_secrets["cache_server"]
  oauth2_client_id          = local.service_secrets["oauth2_client_id"]
  oauth2_client_secret      = local.service_secrets["oauth2_client_secret"]
  payments_api_url          = local.service_secrets["payments_api_url"]

  # create a map of secret name => secret arn to pass into ecs service module
  # using the trimprefix function to remove the prefixed path from the secret name
  secrets_arn_map = {
    for sec in data.aws_ssm_parameter.secret:
      trimprefix(sec.name, "/${local.name_prefix}/") => sec.arn
  }

  service_secrets_arn_map = {
    for sec in module.secrets.secrets:
      trimprefix(sec.name, "/${local.service_name}-${var.environment}/") => sec.arn
  }

  # TODO: task_secrets don't seem to correspond with 'parameter_store_secrets'. What is the difference?
  task_secrets = [
    { "name": "COOKIE_SECRET", "valueFrom": "${local.secrets_arn_map.web-oauth2-cookie-secret}" },
    { "name": "CHS_API_KEY", "valueFrom": "${local.service_secrets_arn_map.chs_api_key}" },
    { "name": "CACHE_SERVER", "valueFrom": "${local.service_secrets_arn_map.cache_server}" },
    { "name": "OAUTH2_CLIENT_ID", "valueFrom": "${local.service_secrets_arn_map.oauth2_client_id}" },  
    { "name": "OAUTH2_CLIENT_SECRET", "valueFrom": "${local.service_secrets_arn_map.oauth2_client_secret}" },
    { "name": "ACCOUNT_URL", "valueFrom": "${local.service_secrets_arn_map.account_url}" },
    { "name": "INTERNAL_API_URL", "valueFrom": "${local.service_secrets_arn_map.internal.api.url}"},
    { "name": "PAYMENTS_API_URL", "valueFrom": "${local.service_secrets_arn_map.payments_api_url}" }
  ]

  task_environment = [
    { "name": "NODE_PORT", "value": "${local.container_port}" },
    { "name": "API_LOCAL_URL", "valueFrom": "${var.api.local.url}"},
    { "name": "AUTHENTICATION_MIDDLEWARE", "valueFrom": "${var.authentication.middleware}"},
    { "name": "CACHE_SERVER", "valueFrom": "${var.cache.server}"},
    { "name": "CDN_HOST", "valueFrom": "${var.cdn_host}"},
    { "name": "CHS_API_KEY", "valueFrom": "${var.chs.api.key}"},
    { "name": "CHS_URL", "valueFrom": "${var.chs_url}"},
    { "name": "COOKIE_DOMAIN", "valueFrom": "${var.cookie_domain}"},
    { "name": "COOKIE_EXPIRATION_IN_SECONDS", "valueFrom": "${var.expiration.in.seconds}"},
    { "name": "COOKIE_NAME", "valueFrom": "${var.cookie_name}"},
    { "name": "COOKIE_SECRET", "valueFrom": "${var.cookie.secret}"},
    { "name": "COOKIE_SECURE_FLAG", "valueFrom": "${var.cookie.secret.flag}"},
    { "name": "DEFAULT_SESSION_EXPIRATION", "valueFrom": "${var.default.session.expiration}"},
    { "name": "EXTENSIONS_API_URL", "valueFrom": "${var.extensions.api.url}"},
    { "name": "EXTENSIONS_PROCESSOR_API_URL", "valueFrom": "${var.extensions.processor.api.url}"},
    { "name": "FEATURE_REQUEST_COUNT", "valueFrom": "${var.feature.request.count}"},
    { "name": "HUMAN_LOG", "valueFrom": "${var.human.log}"},
    { "name": "LOG_LEVEL", "valueFrom": "${var.log_level}"},
    { "name": "MAXIMUM_EXTENSION_REQUESTS_PER_DAY", "valueFrom": "${var.maximum.extension.requests.per.day}"},
    { "name": "MAX_EXTENSION_PERIOD_IN_MONTHS", "valueFrom": "${var.max.extension.period.in.minutes}"},
    { "name": "MAX_FILE_SIZE_BYTES", "valueFrom": "${var.max.file.size.bytes}"},
    { "name": "PERMISSION_NAME_DOWNLOAD", "valueFrom": "${var.permission.name.download}"},
    { "name": "PERMISSION_NAME_VIEW", "valueFrom": "${var.permission.name.view}"},
    { "name": "PIWIK_SITE_ID", "valueFrom": "${var.piwik_site_id}"},
    { "name": "PIWIK_URL", "valueFrom": "${var.piwik_url}"},
    { "name": "SESSION_CREATE", "valueFrom": "${var.session.create}"},
    { "name": "SHOW_SERVICE_UNAVAILABLE_PAGE", "valueFrom": "${var.show.service.unavailable.page}"},
    { "name": "TOO_SOON_DAYS_BEFORE_DUE_DATE", "valueFrom": "${var.too.soon.days.before.due.date}"},
  ]
}
