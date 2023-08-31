# ------------------------------------------------------------------------------
# Environment
# ------------------------------------------------------------------------------
variable "environment" {
  type        = string
  description = "The environment name, defined in envrionments vars."
}
variable "aws_region" {
  default     = "eu-west-2"
  type        = string
  description = "The AWS region for deployment."
}
variable "aws_profile" {
  default     = "development-eu-west-2"
  type        = string
  description = "The AWS profile to use for deployment."
}
variable "kms_alias" {
  type        = string
}
# ------------------------------------------------------------------------------
# Terraform
# ------------------------------------------------------------------------------
variable "aws_bucket" {
  type        = string
  description = "The bucket used to store the current terraform state files"
}
variable "remote_state_bucket" {
  type        = string
  description = "Alternative bucket used to store the remote state files from ch-service-terraform"
}
variable "state_prefix" {
  type        = string
  description = "The bucket prefix used with the remote_state_bucket files."
}
variable "deploy_to" {
  type        = string
  description = "Bucket namespace used with remote_state_bucket and state_prefix."
}

# ------------------------------------------------------------------------------
# Docker Container
# ------------------------------------------------------------------------------
variable "docker_registry" {
  type        = string
  description = "The FQDN of the Docker registry."
}

# ------------------------------------------------------------------------------
# Service performance and scaling configs
# ------------------------------------------------------------------------------
variable "desired_task_count" {
  type = number
  description = "The desired ECS task count for this service"
  default = 1 # defaulted low for dev environments, override for production
}
variable "required_cpus" {
  type = number
  description = "The required cpu resource for this service. 1024 here is 1 vCPU"
  default = 128 # defaulted low for dev environments, override for production
}
variable "required_memory" {
  type = number
  description = "The required memory for this service"
  default = 256 # defaulted low for node service in dev environments, override for production
}

# ------------------------------------------------------------------------------
# Service environment variable configs
# ------------------------------------------------------------------------------
variable "api_local_url" {
  type        = string
}
variable "authentication_middleware" {
  type        = string
  default     = "on"
}
variable "cache_server" {
  type        = string
  default     = "redis"
}
variable "cdn_host" {
  type        = string
}
variable "chs_api_key" {
  type        = string
}
variable "chs_url" {
  type        = string
}
variable "cookie_domain" {
  type        = string
}
variable "cookie_expiration_in_seconds" {
  type        = string
  default     = "3600"
}
variable "cookie_name" {
  type        = string
  default     = "__SID"
}
variable "cookie_secret" {
  type        = string
}
variable "cookie_secure_flag" {
  type        = string
  default     = "0"
}
variable "default_session_expiration" {
  type        = string
  default     = "3600"
}
variable "extensions_api_url" {
  type        = string
}
variable "extensions_processor_api_url" {
  type        = string
}
variable "feature_request_count" {
  type        = string
}
variable "human_log" {
  type        = string
  default     = "1"
}
variable "internal_api_url" {
  type        = string
}
variable "log_level" { 
  type        = string
  description = "The log level for services to use: trace, debug, info or error"
  default     = "info"
}
variable "maximum_extension_requests_per_day" {
  type        = string
  default     = "50"
}
variable "max_extension_period_in_months" {
  type        = string
  default     = "12"
}
variable "max_file_size_bytes" {
  type        = string
  default     = "4194304"
}
variable "permission_name_download" {
  type        = string
}
variable "permission_name_view" {
  type        = string
}
variable "piwik_site_id" {
  type        = string
  default     = " 7"
}
variable "piwik_url" {
  type        = string
}
variable "session_create" {
  type        = string
  default     = "off"
}
variable "show_service_unavailable_page" {
  type        = string
  default     = "off"
}
variable "too_soon_days_before_due_date" {
  type        = string
  default     = "60"
}
