import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const migrations = [
  'supabase/migrations/20251217_create_feedback_system.sql',
  'supabase/migrations/20251217_create_pricing_system.sql',
  'supabase/migrations/20251217_create_feature_flags.sql',
  'supabase/migrations/20251217_create_analytics_events.sql'
]

let combined = ''

for (const migration of migrations) {
  const fullPath = join(__dirname, migration)
  const content = readFileSync(fullPath, 'utf-8')
  combined += content + '\n\n'
}

const outputPath = join(__dirname, 'supabase/migrations/ALL_PHASE2_MIGRATIONS.sql')
writeFileSync(outputPath, combined, 'utf-8')

console.log(`✅ Combined ${migrations.length} migrations into ALL_PHASE2_MIGRATIONS.sql`)
console.log(`📄 Total size: ${combined.length} characters`)
