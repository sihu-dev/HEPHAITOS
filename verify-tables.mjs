import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://demwsktllidwsxahqyvd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbXdza3RsbGlkd3N4YWhxeXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzkxNjIsImV4cCI6MjA3NzYxNTE2Mn0.t5Sykb2IBAyvHiC3_AQ8HIpkTlqlW_EZAfKCpzS1iJc'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('📊 Verifying Phase 2 tables...\n')

const tables = [
  { name: 'feedback', description: 'User Feedback System' },
  { name: 'credit_packages', description: 'Dynamic Pricing Packages' },
  { name: 'feature_pricing', description: 'Feature Credit Costs' },
  { name: 'feature_flags', description: 'A/B Testing Flags' },
  { name: 'analytics_events', description: 'Event Tracking' }
]

for (const table of tables) {
  try {
    const { data, error, count } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ ${table.name.padEnd(20)} - NOT FOUND`)
      console.log(`   Error: ${error.message}\n`)
    } else {
      console.log(`✅ ${table.name.padEnd(20)} - EXISTS (${count || 0} rows)`)
      console.log(`   ${table.description}\n`)
    }
  } catch (err) {
    console.log(`❌ ${table.name.padEnd(20)} - ERROR: ${err.message}\n`)
  }
}

console.log('🎉 Phase 2 verification complete!')
console.log('\n📋 Next steps:')
console.log('1. Visit: https://hephaitos.vercel.app')
console.log('2. Test feedback widget (bottom-right corner)')
console.log('3. Check pricing section loads from database')
console.log('4. Verify feature flags are working')
