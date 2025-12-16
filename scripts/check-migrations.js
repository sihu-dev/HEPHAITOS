const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigrations() {
  console.log('\n🔍 Checking if migrations are needed...\n');

  // Check if tables exist
  const tables = ['backtest_jobs', 'strategy_performance_mv', 'refund_requests'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      
      if (error) {
        console.log(`✗ ${table}: Not found (Migration needed)`);
      } else {
        console.log(`✓ ${table}: Exists`);
      }
    } catch (err) {
      console.log(`✗ ${table}: Error - ${err.message}`);
    }
  }
  
  console.log('\n');
}

checkMigrations();
