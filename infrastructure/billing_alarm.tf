# Billing alarm - must be in us-east-1
# Note: Requires AWS to receive billing data (can take 24h for new accounts)

resource "aws_sns_topic" "billing" {
  provider = aws.us_east_1
  name     = "${var.project_name}-billing-alarm"
}

resource "aws_sns_topic_subscription" "billing" {
  provider  = aws.us_east_1
  topic_arn = aws_sns_topic.billing.arn
  protocol  = "email"
  endpoint  = var.billing_alarm_email
}

resource "aws_cloudwatch_metric_alarm" "billing" {
  provider            = aws.us_east_1
  alarm_name          = "${var.project_name}-billing-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = 86400 # 24 hours
  statistic           = "Maximum"
  threshold           = 0.01

  dimensions = {
    Currency = "USD"
  }

  alarm_description = "Triggers when estimated charges exceed $0.01"
  alarm_actions     = [aws_sns_topic.billing.arn]
}
