# Define all hardcoded local variable and local variables looked up from data resources
locals {
  stack_name                = "company-requests" # this must match the stack name the service deploys into
  name_prefix               = "${local.stack_name}-${var.environment}"
  service_name              = "extensions-web"
  container_port            = "3000" # default node port required here until prod docker container is built allowing port change via env var
  docker_repo               = "extensions-web"
  lb_listener_rule_priority = 95
  lb_listener_paths         = ["/extensions/*"]
  healthcheck_path          = "/extensions/healthcheck" #healthcheck path for extensions web
  healthcheck_matcher       = "200"

  service_secrets           = jsondecode(data.vault_generic_secret.service_secrets.data_json)

  parameter_store_secrets    = {
    "vpc_name"                  = local.service_secrets["vpc_name"]
    "chs_api_key"               = local.service_secrets["chs_api_key"]
    "internal_api_url"          = local.service_secrets["internal_api_url"]   
    "account_url"               = local.service_secrets["account_url"]
    "cache_server"              = local.service_secrets["cache_server"]
    "oauth2_client_id"          = local.service_secrets["oauth2_client_id"]
    "oauth2_client_secret"      = local.service_secrets["oauth2_client_secret"]
  }

  vpc_name                  = local.service_secrets["vpc_name"]
  chs_api_key               = local.service_secrets["chs_api_key"]
  internal_api_url          = local.service_secrets["internal_api_url"]
  account_url               = local.service_secrets["account_url"]
  cache_server              = local.service_secrets["cache_server"]
  oauth2_client_id          = local.service_secrets["oauth2_client_id"]
  oauth2_client_secret      = local.service_secrets["oauth2_client_secret"]

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

  task_secrets = [
    { "name": "COOKIE_SECRET", "valueFrom": "${local.secrets_arn_map.web-oauth2-cookie-secret}" },
    { "name": "VPC_NAME", "valueFrom": "${local.service_secrets_arn_map.vpc_name}" },
    { "name": "CHS_API_KEY", "valueFrom": "${local.service_secrets_arn_map.chs_api_key}" },
    { "name": "INTERNAL_API_URL", "valueFrom": "${local.service_secrets_arn_map.internal_api_url}" },
    { "name": "ACCOUNT_URL", "valueFrom": "${local.service_secrets_arn_map.account_url}" },
    { "name": "CACHE_SERVER", "valueFrom": "${local.service_secrets_arn_map.cache_server}" },
    { "name": "OAUTH2_CLIENT_ID", "valueFrom": "${local.service_secrets_arn_map.oauth2_client_id}" },
    { "name": "OAUTH2_CLIENT_SECRET", "valueFrom": "${local.service_secrets_arn_map.oauth2_client_secret}" },
    { "name": "EXTENSIONS_API_URL", "valueFrom": "${local.service_secrets_arn_map.internal_api_url}" },
    { "name": "EXTENSIONS_PROCESSOR_API_URL", "valueFrom": "${local.service_secrets_arn_map.internal_api_url}" }
  ]

  task_environment = [
    { "name": "NODE_PORT", "value": "${local.container_port}" },
    { "name": "API_LOCAL_URL", "value": "${var.api_local_url}"},  
    { "name": "CDN_HOST", "value": "${var.cdn_host}"},
    { "name": "CHS_URL", "value": "${var.chs_url}"},
    { "name": "COOKIE_DOMAIN", "value": "${var.cookie_domain}"},
    { "name": "COOKIE_EXPIRATION_IN_SECONDS", "value": "${var.cookie_expiration_in_seconds}"},
    { "name": "COOKIE_NAME", "value": "${var.cookie_name}"},
    { "name": "COOKIE_SECURE_FLAG", "value": "${var.cookie_secure_flag}"},
    { "name": "DEFAULT_SESSION_EXPIRATION", "value": "${var.default_session_expiration}"},
    { "name": "FEATURE_REQUEST_COUNT", "value": "${var.feature_request_count}"},
    { "name": "HUMAN_LOG", "value": "${var.human_log}"},
    { "name": "LOG_LEVEL", "value": "${var.log_level}"},
    { "name": "MAXIMUM_EXTENSION_REQUESTS_PER_DAY", "value": "${var.maximum_extension_requests_per_day}"},
    { "name": "MAX_EXTENSION_PERIOD_IN_MONTHS", "value": "${var.max_extension_period_in_months}"},
    { "name": "MAX_FILE_SIZE_BYTES", "value": "${var.max_file_size_bytes}"},
    { "name": "PERMISSION_NAME_DOWNLOAD", "value": "${var.permission_name_download}"},
    { "name": "PERMISSION_NAME_VIEW", "value": "${var.permission_name_view}"},
    { "name": "PIWIK_SITE_ID", "value": "${var.piwik_site_id}"},
    { "name": "PIWIK_URL", "value": "${var.piwik_url}"},
    { "name": "SESSION_CREATE", "value": "${var.session_create}"},
    { "name": "SHOW_SERVICE_UNAVAILABLE_PAGE", "value": "${var.show_service_unavailable_page}"},
    { "name": "TOO_SOON_DAYS_BEFORE_DUE_DATE", "value": "${var.too_soon_days_before_due_date}"},
  ]
}
