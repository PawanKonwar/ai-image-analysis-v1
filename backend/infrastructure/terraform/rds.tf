# PostgreSQL db.t4g.micro instance (free tier eligible)

resource "aws_db_instance" "main" {
  identifier = "ai-image-analysis-db"

  engine         = "postgres"
  engine_version = "16"
  instance_class = "db.t4g.micro"

  db_name  = "ai_image_analysis"
  username = "postgres"
  password = var.db_password

  allocated_storage     = 20
  max_allocated_storage = 20

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = true
  multi_az               = false

  backup_retention_period = 1
  skip_final_snapshot    = true
}
