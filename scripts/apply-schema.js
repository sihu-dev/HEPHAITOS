// ============================================
// Apply Database Schema to Supabase
// Run: node scripts/apply-schema.js
// ============================================

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Supabase Database Connection (Pooler - Session mode)
// Project: demwsktllidwsxahqyvd
const DATABASE_URL = 'postgresql://postgres.demwsktllidwsxahqyvd:sihu19830928@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres'

async function applySchema() {
  console.log('🚀 Applying HEPHAITOS database schema...')

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('📡 Connecting to Supabase PostgreSQL...')
    await client.connect()
    console.log('✅ Connected successfully!')

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Split into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Executing ${statements.length} SQL statements...`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      if (!stmt || stmt.length < 5) continue

      try {
        await client.query(stmt)
        successCount++
        // Show progress every 10 statements
        if (successCount % 10 === 0) {
          console.log(`   Progress: ${successCount}/${statements.length}`)
        }
      } catch (error) {
        // Some errors are expected (e.g., type already exists)
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Skip (exists): ${stmt.substring(0, 50)}...`)
        } else if (error.message.includes('does not exist')) {
          console.log(`   ⚠️  Skip (not found): ${stmt.substring(0, 50)}...`)
        } else {
          console.error(`   ❌ Error: ${error.message}`)
          errorCount++
        }
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`✅ Schema applied! Success: ${successCount}, Errors: ${errorCount}`)
    console.log('='.repeat(50))

    // Verify tables exist
    console.log('\n📊 Verifying tables...')
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    console.log('Tables created:')
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`)
    })

  } catch (error) {
    console.error('❌ Connection error:', error.message)
    console.log('\n📋 Alternative: Run SQL manually in Supabase Dashboard:')
    console.log('   https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/sql/new')
  } finally {
    await client.end()
  }
}

applySchema()
