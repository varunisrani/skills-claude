#!/bin/bash

# Create task issues for epic improve-ui-with-pure-css

for task_file in .claude/epics/improve-ui-with-pure-css/[0-9][0-9][0-9].md; do
  [ -f "$task_file" ] || continue

  task_name=$(grep '^name:' "$task_file" | sed 's/^name: *//')
  sed '1,/^---$/d; 1,/^---$/d' "$task_file" > /tmp/task-body.md

  task_url=$(gh issue create --repo "varunisrani/sdjd2" --title "$task_name" --body-file /tmp/task-body.md --label "task")
  task_number=$(echo "$task_url" | grep -oP '/issues/\K[0-9]+')

  echo "$task_file:$task_number" >> /tmp/task-mapping.txt
  echo "Created: $task_name -> #$task_number"
done

echo "All tasks created!"
