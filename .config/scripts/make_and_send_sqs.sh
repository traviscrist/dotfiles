# Read message data from the existing JSON file
original_data=$(cat original.json)

total_messages=$(echo "$original_data" | jq 'length')
batch_size=10
total_batches=$(( (total_messages + batch_size - 1) / batch_size ))

# Create batch files
for ((batch_number = 1; batch_number <= total_batches; batch_number++)); do
  start_index=$(( (batch_number - 1) * batch_size ))
  end_index=$(( start_index + batch_size - 1 ))
  if [ $end_index -ge $total_messages ]; then
    end_index=$((total_messages - 1))
  fi

  # Create a JSON file for the current batch
  echo "[" > "batch_$batch_number.json"
  idx=1
  for ((i = start_index; i <= end_index; i++)); do
    message_body=$(echo "$original_data" | jq -c -r ".[$i]")
    escaped_message_body=$(echo "$message_body" | sed 's/"/\\\"/g')
    if [ $idx -lt $batch_size ]; then
      echo "  {\"Id\":\"$idx\", \"MessageBody\":\"$escaped_message_body\"}," >> "batch_$batch_number.json"
    else
      echo "  {\"Id\":\"$idx\", \"MessageBody\":\"$escaped_message_body\"}" >> "batch_$batch_number.json"
    fi
    idx=$((idx+1))
  done
  echo "]" >> "batch_$batch_number.json"

  # Send the current batch using the AWS CLI
  aws sqs send-message-batch \
    --queue-url <your-queue-url> \
    --entries file://"batch_$batch_number.json"

  sleep 60
done
