import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase credentials
const supabaseUrl = 'https://demwsktllidwsxahqyvd.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbXdza3RsbGlkd3N4YWhxeXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAzOTE2MiwiZXhwIjoyMDc3NjE1MTYyfQ.gwymDfSe4JckDrB87ASsflJaKo4EMer4PV-qN6yjX8c'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Migration files in order
const migrations = [
  'supabase/migrations/20251217_create_feedback_system.sql',
  'supabase/migrations/20251217_create_pricing_system.sql',
  'supabase/migrations/20251217_create_feature_flags.sql',
  'supabase/migrations/20251217_create_analytics_events.sql'
]

async function runMigrations() {
  console.log('🚀 Starting Supabase migrations...\n')

  for (const migrationPath of migrations) {
    try {
      const fullPath = join(__dirname, migrationPath)
      const sql = readFileSync(fullPath, 'utf-8')

      console.log(`📄 Running: ${migrationPath}`)

      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

      if (error) {
        console.error(`❌ Error in ${migrationPath}:`, error.message)
        // Try alternative method using REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql_query: sql })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ REST API error: ${errorText}`)
        } else {
          console.log(`✅ Success (via REST API)`)
        }
      } else {
        console.log(`✅ Success`)
      }

      console.log('')
    } catch (err) {
      console.error(`❌ Exception in ${migrationPath}:`, err.message)
    }
  }

  console.log('🎉 Migration process complete!\n')
  console.log('📊 Verifying tables...')

  // Verify tables were created
  const tables = ['feedback', 'credit_packages', 'feature_pricing', 'feature_flags', 'analytics_events']

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)

    if (error) {
      console.log(`❌ ${table}: NOT FOUND`)
    } else {
      console.log(`✅ ${table}: EXISTS`)
    }
  }
}

runMigrations().catch(console.error)
