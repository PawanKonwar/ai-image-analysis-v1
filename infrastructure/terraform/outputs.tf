output "rds_endpoint" {
  description = "The address of the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_hostname" {
  description = "The hostname of the RDS instance"
  value       = aws_db_instance.main.address
}