aws-ssh() {
  aws ssm start-session --target $1 --profile $2
}

# Describes AWS instances
describe-instances() {
  aws --version
  which aws
  [ -z "$1" ] && DI_PROFILE="" || DI_PROFILE="$1"
  [ -z "$2" ] && DI_REGION="" || DI_REGION=" --region $2"
  aws ec2 describe-instances --profile $1 --filters 'Name=instance-state-name,Values=running' --query 'Reservations[].Instances[].[PublicIpAddress,PrivateIpAddress,InstanceId,Tags[?Key==`Name`].Value[]||[`--`]]' --output text | sed '$!N;s/\n/ /' | column -t -s $'\t'
}

d-logs() {
  docker-compose logs --tail=100 -f $1 $2 $3 $4
}

d-up() {
  docker-compose up -d $1
}

d-down() {
  docker-compose down $1
}

d-up-logs() {
  docker-compose up -d && docker-compose logs --tail=100 -f $1
}

d-up-logs-web() {
  docker-compose up -d && docker-compose logs web --tail=100 -f $1
}

d-restart-logs() {
  docker-compose restart web && docker-compose logs --tail=100 -f $1
}

dc() {
  docker-compose
}
