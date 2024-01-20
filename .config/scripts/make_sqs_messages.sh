# Read message data from the existing JSON file
original_data=$(cat original.json)

# Create a JSON file with message data and Ids
echo "[" > batch.json
idx=1
total_messages=$(echo "$original_data" | jq 'length')
for message_body in $(echo "$original_data" | jq -c -r '.[]'); do
  escaped_message_body=$(echo "$message_body" | sed 's/"/\\\"/g')
  if [ $idx -lt $total_messages ]; then
    echo "  {\"Id\":\"$idx\", \"MessageBody\":\"$escaped_message_body\"}," >> batch.json
  else
    echo "  {\"Id\":\"$idx\", \"MessageBody\":\"$escaped_message_body\"}" >> batch.json
  fi
  idx=$((idx+1))
done
echo "]" >> batch.json
