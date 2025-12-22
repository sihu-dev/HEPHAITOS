#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Repository list
REPOS=(
  "forge-labs"
  "bidflow"
  "HEPHAITOS"
  "dryon"
)

echo -e "${BLUE}🚀 Repository Features Enabler${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}📁 Working directory: $TEMP_DIR${NC}"
echo ""

# Workflow file content
WORKFLOW_FILE=".github/workflows/enable-features.yml"

for REPO in "${REPOS[@]}"; do
  echo -e "${BLUE}📦 Processing: ${REPO}${NC}"

  REPO_DIR="$TEMP_DIR/$REPO"

  # Clone repository
  echo "  📥 Cloning repository..."
  git clone "http://local_proxy@127.0.0.1:36370/git/sihu-dev/$REPO" "$REPO_DIR" --depth=1 -q 2>/dev/null || {
    echo -e "${RED}  ❌ Failed to clone $REPO${NC}"
    continue
  }

  cd "$REPO_DIR"

  # Create workflow directory
  mkdir -p .github/workflows

  # Create workflow file
  echo "  ⚙️  Creating workflow file..."
  cat > "$WORKFLOW_FILE" << 'EOF'
name: Enable Repository Features

on:
  workflow_dispatch:
  push:
    branches:
      - main
      - master
    paths:
      - '.github/workflows/enable-features.yml'

jobs:
  enable-features:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write

    steps:
      - name: Enable Repository Features
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO_NAME: ${{ github.repository }}
        run: |
          echo "🔧 Enabling features for $REPO_NAME..."

          # Enable repository features
          curl -X PATCH \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer $GH_TOKEN" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            "https://api.github.com/repos/$REPO_NAME" \
            -d '{
              "has_issues": true,
              "has_projects": true,
              "has_wiki": true,
              "has_discussions": true,
              "allow_squash_merge": true,
              "allow_merge_commit": true,
              "allow_rebase_merge": true,
              "allow_auto_merge": true,
              "delete_branch_on_merge": true,
              "allow_update_branch": true
            }' || echo "⚠️  Some features may not be available"

          echo "✅ Features enabled successfully!"

      - name: Summary
        run: |
          echo "### ✅ Repository Features Enabled" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Enabled:**" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ Issues" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ Projects" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ Wiki" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ Discussions" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ All merge types" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ Auto-merge" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ Delete branch on merge" >> $GITHUB_STEP_SUMMARY
EOF

  # Check if main or master branch exists
  DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")

  # Create a new branch for the workflow
  BRANCH_NAME="feat/enable-repo-features-$(date +%s)"
  git checkout -b "$BRANCH_NAME" -q

  # Add and commit
  git add .github/workflows/enable-features.yml
  git commit -m "feat: add workflow to enable all repository features

- Enable Issues, Projects, Wiki, Discussions
- Enable all merge types
- Enable auto-merge and delete branch on merge
" -q

  # Push to remote
  echo "  📤 Pushing workflow..."
  git push -u origin "$BRANCH_NAME" -q 2>&1 | grep -v "remote:" || {
    echo -e "${RED}  ❌ Failed to push to $REPO${NC}"
    cd - > /dev/null
    continue
  }

  echo -e "${GREEN}  ✅ Workflow deployed to $REPO${NC}"
  echo -e "${YELLOW}  🔗 Branch: $BRANCH_NAME${NC}"
  echo ""

  cd - > /dev/null
done

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}✨ All workflows deployed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Go to each repository on GitHub"
echo "2. Merge the feature branch to main/master"
echo "3. The workflow will run automatically and enable all features"
echo ""
echo -e "${BLUE}Or manually trigger the workflow:${NC}"
for REPO in "${REPOS[@]}"; do
  echo "  https://github.com/sihu-dev/$REPO/actions"
done
echo ""
