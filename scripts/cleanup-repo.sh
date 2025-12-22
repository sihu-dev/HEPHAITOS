#!/bin/bash

# HEPHAITOS Repository Cleanup Script
# Run this script to organize documentation and remove obsolete files
# Author: HEPHAITOS Team
# Date: 2025-12-22

set -e  # Exit on error

echo "🧹 Starting HEPHAITOS repository cleanup..."
echo ""

# Create archive directory
echo "📁 Creating archive directory..."
mkdir -p docs/archive
echo "   ✓ Created docs/archive/"

# Move outdated/archive documents
echo ""
echo "📦 Moving outdated documents to archive..."
moved_count=0

for file in \
  CMENTECH_*.md CMenTech_*.md \
  COMPREHENSIVE_AUDIT_V*.md \
  BETA_FEATURE_AUDIT.md \
  DEVELOPMENT_LOOP.md FRONTEND_QA_LOOP.md \
  PHASE_2_COMPLETE.md \
  HEPHAITOS_EXECUTIVE_SUMMARY.md HEPHAITOS_ONE_PAGER.md \
  LANDING_PAGE_*.md MOBILE_WIREFRAME.md \
  DEPLOYMENT_CHECKLIST.md DEPLOYMENT_STATUS.md \
  BETA_INVITE_TEMPLATE.md BETA_LAUNCH_READY.md \
  MOA_COMPLETE.md API_SETUP_COMPLETE.md \
  MARKET_RESEARCH_*.md COPY_STRATEGY.md \
  DEEP_DIVE_ANALYSIS.md REMOTE_WORK_GUIDE.md \
  LOCAL_TESTING_GUIDE.md V1_FEEDBACK_*.md \
  QUICK_START_BETA.md START_UXUI_AUDIT.md
do
  if [ -f "$file" ]; then
    mv "$file" docs/archive/
    echo "   ✓ Moved: $file"
    ((moved_count++))
  fi
done

echo "   📊 Moved $moved_count files to archive"

# Delete temporary files
echo ""
echo "🗑️  Removing temporary session files..."
deleted_count=0

for file in \
  .pair-programming-session.md \
  .session-summary.md \
  .project-structure.md
do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "   ✓ Deleted: $file"
    ((deleted_count++))
  fi
done

echo "   📊 Deleted $deleted_count temporary files"

# Move current setup guides to docs
echo ""
echo "📚 Organizing setup guides..."
guides_moved=0

if [ -f "UPSTASH_SETUP_GUIDE.md" ]; then
  mv UPSTASH_SETUP_GUIDE.md docs/
  echo "   ✓ Moved: UPSTASH_SETUP_GUIDE.md → docs/"
  ((guides_moved++))
fi

if [ -f "SUPABASE_SETUP.md" ]; then
  mv SUPABASE_SETUP.md docs/
  echo "   ✓ Moved: SUPABASE_SETUP.md → docs/"
  ((guides_moved++))
fi

echo "   📊 Organized $guides_moved setup guides"

# Summary
echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "   • Files archived: $moved_count"
echo "   • Files deleted: $deleted_count"
echo "   • Guides organized: $guides_moved"
echo ""

# Count remaining root .md files
root_md_count=$(find . -maxdepth 1 -name "*.md" -type f | wc -l)
echo "📄 Remaining root .md files: $root_md_count"
echo ""

# List remaining files
echo "📝 Core documentation files in root:"
ls -1 *.md 2>/dev/null | head -15 || echo "   (none)"

echo ""
echo "🎉 Repository is now cleaner and more organized!"
echo ""
echo "Next steps:"
echo "  1. Review docs/archive/ for any files to restore"
echo "  2. Update README.md links if needed"
echo "  3. Run: git status"
echo "  4. Commit changes: git add . && git commit -m 'docs: organize repository documentation'"
