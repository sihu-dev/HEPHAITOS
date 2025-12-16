#!/usr/bin/env node
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase connection details
const SUPABASE_PROJECT_REF = 'demwsktllidwsxahqyvd'
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || ''

if (!SUPABASE_DB_PASSWORD) {
  console.error('❌ SUPABASE_DB_PASSWORD environment variable is required')
  console.log('\n📋 To get your database password:')
  console.log('1. Go to: https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/settings/database')
  console.log('2. Scroll to "Connection string" section')
  console.log('3. Click "Reset database password" if you don\'t have it')
  console.log('4. Copy the password and run:')
  console.log('   SET SUPABASE_DB_PASSWORD=your_password')
  console.log('   node migrate.mjs')
  console.log('\n💡 Or run directly:')
  console.log('   SUPABASE_DB_PASSWORD=your_password node migrate.mjs')
  process.exit(1)
}

const connectionString = `postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

// Migration files in order
const migrations = [
  'supabase/migrations/20251217_create_feedback_system.sql',
  'supabase/migrations/20251217_create_pricing_system.sql',
  'supabase/migrations/20251217_create_feature_flags.sql',
  'supabase/migrations/20251217_create_analytics_events.sql'
]

async function runMigrations() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('🚀 Running migrations...\n')

    for (const migrationPath of migrations) {
      try {
        const fullPath = join(__dirname, migrationPath)
        const sql = readFileSync(fullPath, 'utf-8')

        console.log(`📄 Executing: ${migrationPath}`)

        await client.query(sql)

        console.log(`✅ Success\n`)
      } catch (err) {
        console.error(`❌ Error in ${migrationPath}:`)
        console.error(err.message)
        console.error('')
      }
    }

    console.log('🎉 Migration process complete!\n')
    console.log('📊 Verifying tables...')

    // Verify tables
    const tables = ['feedback', 'credit_packages', 'feature_pricing', 'feature_flags', 'analytics_events']

    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM public.${table}`)
        console.log(`✅ ${table}: EXISTS (${result.rows[0].count} rows)`)
      } catch (err) {
        console.log(`❌ ${table}: NOT FOUND`)
      }
    }

    console.log('\n🎊 All done! Phase 2 features are now active.')

  } catch (err) {
    console.error('❌ Connection error:', err.message)
    console.log('\n💡 Make sure your database password is correct.')
    console.log('Get it from: https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/settings/database')
  } finally {
    await client.end()
  }
}

runMigrations().catch(console.error)
