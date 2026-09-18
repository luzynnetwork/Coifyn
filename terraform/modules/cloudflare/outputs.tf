output "dns_record_hostname" {
  value = cloudflare_record.wildcard.hostname
}
