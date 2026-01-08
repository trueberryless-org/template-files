#!/bin/bash

set -e

# Ensure required environment variables are set
: "${GH_TOKEN:?Environment variable GH_TOKEN is required}"
: "${REPO_NAME:?Environment variable REPO_NAME is required}"
: "${FILES:?Environment variable FILES is required}"

git config --global user.name "github-actions[bot]"
git config --global user.email "github-actions[bot]@users.noreply.github.com"

echo "Processing repository: $REPO_NAME"

# Clone the target repository
echo "Cloning repository $REPO_NAME..."
git clone --depth 1 "https://x-access-token:${GH_TOKEN}@github.com/${REPO_NAME}.git" target-repo
cd target-repo

# Create or switch to the branch
branch_name="update-template-files"
echo "Creating branch $branch_name..."
git checkout -b "$branch_name" || git checkout "$branch_name"

declare -a modified_package_jsons=()

# Sync specified template files
for file_config in $(echo "$FILES" | jq -c '.[]'); do
  src_file_raw=$(echo "$file_config" | jq -r '.path')
  dest_file=$(echo "$file_config" | jq -r '.targetPath')
  special=$(echo "$file_config" | jq -r '.special // empty')

  echo "Processing file: $src_file_raw -> $dest_file"

  # Detect if src_file is a URL or relative path
  if [[ "$src_file_raw" =~ ^https?:// ]]; then
    echo "$src_file is a URL. Downloading it..."
    temp_file=$(mktemp)
    if ! curl -sSL "$src_file_raw" -o "$temp_file"; then
      echo "Error: Failed to download $src_file. Skipping..."
      continue
    fi
    src_file="$temp_file"
  else
    echo "$src_file_raw is a relative path. Prefixing with '../'."
    src_file="../$src_file_raw"

    # Check if the file exists (only for local files)
    if [ ! -f "$src_file" ]; then
      echo "Warning: File $src_file not found in /template-files."
      continue
    fi
  fi

  if [ "$special" == "README.md" ]; then
    echo "Special handling for README.md"

    # Combine existing README.md with the License section
    if [ -f "$dest_file" ]; then
      # Create a temporary file to store the combined content
      echo "Combining existing README.md with the License section..."
      awk '/## License/,EOF' "$src_file" | tail -n +2 > license_content.md
      markdown-replace-section "$dest_file" "License" "$dest_file" < license_content.md
      rm -f license_content.md
    else
      # If no existing README.md, copy the template and add the License section
      echo "No existing README.md found. Creating a new one..."
      cp "$src_file" "$dest_file"
    fi


  elif [ "$special" == "package.json" ]; then
    echo "Special handling for package.json"

    # Prepare the destination directory
    mkdir -p "$(dirname "$dest_file")"

    # Handle dynamic content replacement if "props" is specified
    props=$(echo "$file_config" | jq -c '.props // empty')
    if [ -n "$props" ]; then
      echo "Applying dynamic replacements for $src_file..."
      temp_file=$(mktemp)
      cp "$src_file" "$temp_file"

      # Replace placeholders with their respective values from props
      for key in $(echo "$props" | jq -r 'keys[]'); do
        value=$(echo "$props" | jq -r --arg key "$key" '.[$key]')
        placeholder="<%= $key %>"
        echo "Replacing $placeholder with $value in $src_file..."
        sed -i "s|$placeholder|$value|g" "$temp_file"
      done

      temp_file_2=$(mktemp)
      jq -s 'reduce .[] as $item ({}; . * $item)' "$dest_file" "$temp_file" > "$temp_file_2"

      # Move the processed file to the target location
      mv "$temp_file_2" "$dest_file"
      rm -f "$temp_file"
    else
      if [ -f "$dest_file" ]; then
        # If the destination file exists, merge it with the source file
        echo "Destination file $dest_file exists. Merging $src_file into $dest_file..."
        temp_file=$(mktemp)
        jq -s 'reduce .[] as $item ({}; . * $item)' "$dest_file" "$src_file" > "$temp_file"
        mv "$temp_file" "$dest_file"
      else
        # If the destination file does not exist, just copy the source file
        echo "Destination file $dest_file does not exist. Copying $src_file to $dest_file..."
        cp "$src_file" "$dest_file"
      fi
    fi

    modified_package_jsons+=("$dest_file")


  elif [ "$special" == "manifest" ]; then
    echo "Special handling for manifest file"

    # Prepare the destination directory
    mkdir -p "$(dirname "$dest_file")"

    # Resolve placeholders in the source file using props
    props=$(echo "$file_config" | jq -c '.props // empty')
    temp_file=$(mktemp)
    cp "$src_file" "$temp_file"

    if [ -n "$props" ]; then
      for key in $(echo "$props" | jq -r 'keys[]'); do
        value=$(echo "$props" | jq -r --arg key "$key" '.[$key]')
        placeholder="<%= $key %>"
        echo "Replacing $placeholder with $value in $src_file..."
        sed -i "s|$placeholder|$value|g" "$temp_file"
      done
    fi

    # Check if the destination file exists
    if [ -f "$dest_file" ]; then
      # Exclude the image line from comparison
      echo "Comparing $dest_file with $temp_file..."
      if ! diff -q <(grep -Ev 'image:|ports:|containerPort:|targetPort:' "$temp_file") <(grep -Ev 'image:|ports:|containerPort:|targetPort:' "$dest_file") > /dev/null; then
        echo "Significant changes detected. Updating $dest_file..."
      else
        echo "No significant changes detected in $dest_file. Skipping update."
        rm -f "$temp_file"
        continue
      fi
    else
      echo "Destination file $dest_file does not exist. Creating it..."
    fi

    # Move the processed file to the target location
    mv "$temp_file" "$dest_file"


  elif [ "$special" == "allow-additional-lines" ]; then
    # This logic cannot handle cases where a line is changed in the dest_file
    echo "Special handling for file where additional lines are allowed"

    # Prepare the destination directory
    mkdir -p "$(dirname "$dest_file")"

    # Resolve placeholders in the source file using props
    props=$(echo "$file_config" | jq -c '.props // empty')
    temp_file=$(mktemp)
    cp "$src_file" "$temp_file"

    if [ -n "$props" ]; then
      for key in $(echo "$props" | jq -r 'keys[]'); do
        value=$(echo "$props" | jq -r --arg key "$key" '.[$key]')
        placeholder="<%= $key %>"
        echo "Replacing $placeholder with $value in $src_file..."
        sed -i "s|$placeholder|$value|g" "$temp_file"
      done
    fi

    # Check if the destination file exists
    if [ -f "$dest_file" ]; then
      # Compare: allow extra lines in target, only sync if temp adds new lines
      echo "Comparing $dest_file with $temp_file..."
      if comm -23 <(sort "$temp_file") <(sort "$dest_file") | grep -q .;
      then
        echo "Significant changes detected. Updating $dest_file..."
      else
        echo "No significant changes detected in $dest_file. Skipping update."
        rm -f "$temp_file"
        continue
      fi
    else
      echo "Destination file $dest_file does not exist. Creating it..."
    fi

    # Move the processed file to the target location
    mv "$temp_file" "$dest_file"


  elif [ "$special" == "delete" ]; then
    echo "Special handling for delete: removing $dest_file if it exists..."
    if [ -f "$dest_file" ]; then
      rm -f "$dest_file"
      echo "Deleted $dest_file"
    else
      echo "File $dest_file does not exist. Skipping delete."
    fi


  else
    # Prepare the destination directory
    mkdir -p "$(dirname "$dest_file")"

    # Handle dynamic content replacement if "props" is specified
    props=$(echo "$file_config" | jq -c '.props // empty')
    if [ -n "$props" ]; then
      echo "Applying dynamic replacements for $src_file..."
      temp_file=$(mktemp)
      cp "$src_file" "$temp_file"

      # Replace placeholders with their respective values from props
      for key in $(echo "$props" | jq -r 'keys[]'); do
        value=$(echo "$props" | jq -r --arg key "$key" '.[$key]')
        placeholder="<%= $key %>"
        echo "Replacing $placeholder with $value in $src_file..."
        sed -i "s|$placeholder|$value|g" "$temp_file"
      done

      # Move the processed file to the target location
      mv "$temp_file" "$dest_file"
    else
      # If no props, copy the file directly
      cp "$src_file" "$dest_file"
    fi
  fi

  if [[ "$src_file_raw" =~ ^https?:// ]]; then
    echo "Cleaning up temporary file..."
    rm -f "$src_file"
  fi
done

# Post-processing: Run pnpm install only if package.json was modified
if git diff --name-only | grep -q "package.json" || git diff --name-only --cached | grep -q "package.json"; then
  echo "package.json was modified. Running pnpm install..."
  pnpm install --no-frozen-lockfile
else
  echo "No changes to package.json detected. Skipping pnpm install."
fi

if [ ${#modified_package_jsons[@]} -gt 0 ]; then
  echo "Sorting modified package.json files..."
  for package_json in "${modified_package_jsons[@]}"; do
    echo "Sorting $package_json"
    sort-package-json "$package_json"
  done
fi

# Commit and push changes if any
echo "Checking for changes..."
git add .

# Count the number of staged files
changed_count=$(git diff --cached --name-only | wc -l)
echo "Number of changed files: $changed_count"

# Save the count to a GitHub environment variable for later steps
echo "CHANGED_FILES=$changed_count" >> $GITHUB_ENV

if git diff --cached --quiet; then
  echo "No changes detected for $REPO_NAME."

  echo "Checking for an open PR for branch $branch_name..."
  existing_pr=$(gh pr list --base main --head "$branch_name" --json number --jq '.[0].number')

  if [ -n "$existing_pr" ]; then
    echo "Found existing PR #$existing_pr. Closing it..."
    gh pr comment "$existing_pr" -b "The branch has been updated. No changes detected for $REPO_NAME."
    gh pr close "$existing_pr"
  fi
else
  echo "Committing and pushing changes for $REPO_NAME..."
  git commit -m "ci: update GitHub template files"
  git push --force origin "$branch_name"

  cd ..

  latest_commit_hash=$(git rev-parse HEAD)
  latest_commit_url="https://github.com/$GITHUB_REPOSITORY/commit/$latest_commit_hash"
  latest_commit_message=$(git log -1 --pretty=%s)
  modified_message=$(echo "$latest_commit_message" | sed -E "s/\#([0-9]+)/trueberryless-org\/template-files\#\1/g")
  latest_commit_entry="- $modified_message - ([$(git rev-parse --short HEAD)]($latest_commit_url))"

  cd target-repo

  # Check for existing pull request
  echo "Checking for an open PR for branch $branch_name..."
  existing_pr=$(gh pr list --base main --head "$branch_name" --json number --jq '.[0].number')

  if [ -n "$existing_pr" ]; then
    echo "Found existing PR #$existing_pr. Updating it..."
    current_body=$(gh pr view "$existing_pr" --json body --jq '.body')
    updated_body=$(printf "%s\n%s" "$current_body" "$latest_commit_entry")
    gh pr edit "$existing_pr" --body "$updated_body"
    gh pr comment "$existing_pr" --body "The branch has been updated with the [latest changes]($latest_commit_url)."
  else
    echo "No existing PR found. Creating a new one..."
    description=$(printf "%s\n\n%s\n%s" "This PR syncs the specified GitHub template files from the [central repository](https://github.com/trueberryless-org/template-files)." "### Changes:" "$latest_commit_entry")
    gh pr create \
      --base main \
      --head "$branch_name" \
      --title "ci: sync template files [skip ci]" \
      --body "$description" \
      --label "🤖 bot"
  fi
fi

# Cleanup
cd ..
echo "Cleaning up repository clone for $REPO_NAME..."
rm -rf target-repo
