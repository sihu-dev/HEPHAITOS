#!/bin/bash

# ============================================
# HEPHAITOS Auto Test Runner (2026)
# ============================================

set -e

echo "🤖 HEPHAITOS Auto Test Runner"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WATCH_MODE=${1:-false}
COVERAGE=${2:-false}

# Function: Run unit tests
run_unit_tests() {
  echo -e "\n${YELLOW}📦 Running Unit Tests...${NC}"

  if [ "$COVERAGE" = "true" ]; then
    npm run test:coverage -- src/__tests__/lib
  else
    npm test -- src/__tests__/lib
  fi

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Unit tests passed!${NC}"
    return 0
  else
    echo -e "${RED}❌ Unit tests failed!${NC}"
    return 1
  fi
}

# Function: Run integration tests
run_integration_tests() {
  echo -e "\n${YELLOW}🔗 Running Integration Tests...${NC}"

  if [ "$COVERAGE" = "true" ]; then
    npm run test:coverage -- src/__tests__/integration
  else
    npm test -- src/__tests__/integration
  fi

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Integration tests passed!${NC}"
    return 0
  else
    echo -e "${RED}❌ Integration tests failed!${NC}"
    return 1
  fi
}

# Function: Run E2E tests
run_e2e_tests() {
  echo -e "\n${YELLOW}🎭 Running E2E Tests...${NC}"

  npm run test:e2e

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ E2E tests passed!${NC}"
    return 0
  else
    echo -e "${RED}❌ E2E tests failed!${NC}"
    return 1
  fi
}

# Function: Type check
run_type_check() {
  echo -e "\n${YELLOW}📝 Running Type Check...${NC}"

  npx tsc --noEmit

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Type check passed!${NC}"
    return 0
  else
    echo -e "${RED}❌ Type check failed!${NC}"
    return 1
  fi
}

# Function: Lint
run_lint() {
  echo -e "\n${YELLOW}🔍 Running Lint...${NC}"

  npm run lint

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Lint passed!${NC}"
    return 0
  else
    echo -e "${RED}❌ Lint failed!${NC}"
    return 1
  fi
}

# Main execution
main() {
  echo -e "\n${YELLOW}Starting test suite...${NC}\n"

  # Track failures
  FAILED=0

  # Run all checks
  run_type_check || FAILED=$((FAILED + 1))
  run_lint || FAILED=$((FAILED + 1))
  run_unit_tests || FAILED=$((FAILED + 1))
  run_integration_tests || FAILED=$((FAILED + 1))

  # Optionally run E2E (slower)
  if [ "$WATCH_MODE" = "false" ]; then
    run_e2e_tests || FAILED=$((FAILED + 1))
  fi

  # Summary
  echo -e "\n=============================="
  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo -e "${GREEN}✅ Ready for deployment${NC}"
    exit 0
  else
    echo -e "${RED}❌ $FAILED test suite(s) failed${NC}"
    echo -e "${RED}Please fix errors before deploying${NC}"
    exit 1
  fi
}

# Watch mode
if [ "$WATCH_MODE" = "true" ]; then
  echo "👀 Watch mode enabled"
  npm run test:watch
else
  main
fi
