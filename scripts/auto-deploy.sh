#!/bin/bash

# ============================================
# HEPHAITOS Auto Deploy Script (2026)
# ============================================

set -e

echo "🚀 HEPHAITOS Auto Deploy"
echo "========================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-preview}
SKIP_TESTS=${2:-false}

# Function: Check prerequisites
check_prerequisites() {
  echo -e "\n${YELLOW}🔍 Checking prerequisites...${NC}"

  # Check Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
  fi

  # Check npm
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
  fi

  # Check Vercel CLI
  if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
  fi

  echo -e "${GREEN}✅ Prerequisites OK${NC}"
}

# Function: Run pre-deployment checks
pre_deployment_checks() {
  echo -e "\n${YELLOW}🧪 Running pre-deployment checks...${NC}"

  if [ "$SKIP_TESTS" = "true" ]; then
    echo -e "${YELLOW}⚠️ Skipping tests (--skip-tests flag)${NC}"
    return 0
  fi

  # Type check
  echo "📝 Type checking..."
  npx tsc --noEmit

  # Lint
  echo "🔍 Linting..."
  npm run lint --quiet

  # Tests
  echo "🧪 Running tests..."
  npm test -- --run --passWithNoTests

  echo -e "${GREEN}✅ All checks passed${NC}"
}

# Function: Build project
build_project() {
  echo -e "\n${YELLOW}🏗️ Building project...${NC}"

  npm run build

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
  else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
  fi
}

# Function: Deploy to Vercel
deploy_to_vercel() {
  echo -e "\n${YELLOW}🚀 Deploying to Vercel ($ENVIRONMENT)...${NC}"

  if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${RED}⚠️ DEPLOYING TO PRODUCTION${NC}"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
      echo "Deployment cancelled"
      exit 0
    fi

    vercel --prod
  else
    echo -e "${BLUE}📦 Deploying preview...${NC}"
    vercel
  fi

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful${NC}"
  else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
  fi
}

# Function: Post-deployment checks
post_deployment_checks() {
  echo -e "\n${YELLOW}🔍 Running post-deployment checks...${NC}"

  # Health check
  echo "🏥 Checking health endpoint..."
  sleep 5

  # Get deployment URL from Vercel
  DEPLOY_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "")

  if [ -n "$DEPLOY_URL" ]; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOY_URL/api/health")

    if [ "$HTTP_STATUS" = "200" ]; then
      echo -e "${GREEN}✅ Health check passed${NC}"
    else
      echo -e "${RED}❌ Health check failed (HTTP $HTTP_STATUS)${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}⚠️ Could not verify deployment URL${NC}"
  fi
}

# Function: Notify success
notify_success() {
  echo -e "\n${GREEN}========================${NC}"
  echo -e "${GREEN}🎉 Deployment Complete!${NC}"
  echo -e "${GREEN}========================${NC}"

  if [ -n "$DEPLOY_URL" ]; then
    echo -e "\n${BLUE}📎 Deployment URL:${NC}"
    echo "https://$DEPLOY_URL"
  fi

  echo -e "\n${GREEN}✅ All systems operational${NC}"
}

# Main execution
main() {
  echo -e "\n${BLUE}Environment: $ENVIRONMENT${NC}\n"

  check_prerequisites
  pre_deployment_checks
  build_project
  deploy_to_vercel
  post_deployment_checks
  notify_success
}

# Run main
main
