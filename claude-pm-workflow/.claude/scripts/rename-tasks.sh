#!/bin/bash

# Build old->new ID mapping
echo "Building ID mapping..."
> /tmp/id-mapping.txt
while IFS=: read -r task_file task_number; do
  old_num=$(basename "$task_file" .md)
  echo "$old_num:$task_number" >> /tmp/id-mapping.txt
done < /tmp/task-mapping.txt

# Rename files and update references
echo "Renaming files and updating references..."
current_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
repo="varunisrani/sdjd2"

while IFS=: read -r task_file task_number; do
  new_name="$(dirname "$task_file")/${task_number}.md"

  # Read the file content
  content=$(cat "$task_file")

  # Update depends_on and conflicts_with references
  while IFS=: read -r old_num new_num; do
    content=$(echo "$content" | sed "s/\b$old_num\b/$new_num/g")
  done < /tmp/id-mapping.txt

  # Update github field in frontmatter
  github_url="https://github.com/$repo/issues/$task_number"
  content=$(echo "$content" | sed "s|^github:.*|github: $github_url|")
  content=$(echo "$content" | sed "s|^updated:.*|updated: $current_date|")

  # Write updated content to new file
  echo "$content" > "$new_name"

  # Remove old file if different
  if [ "$task_file" != "$new_name" ]; then
    rm "$task_file"
  fi

  echo "Renamed: $task_file -> $new_name"
done < /tmp/task-mapping.txt

echo "All tasks renamed!"
