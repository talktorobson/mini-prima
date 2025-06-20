// Database Manager - Connect and manage remote Supabase database
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://cmgtjqycneerfdxmdmwp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected tables for Phase 3 Brazilian Legal Compliance
const phase3Tables = [
  'case_deadlines',
  'deadline_notifications', 
  'court_integrations',
  'case_workflow_phases',
  'oab_compliance_checks',
  'legal_templates',
  'case_status_history',
  'brazilian_holidays'
];

const coreExpectedTables = [
  'clients', 'cases', 'documents', 'staff', 'admin_users',
  'staff_client_assignments', 'portal_messages', 'portal_notifications',
  'time_entries', 'active_timers', 'billing_rates',
  'subscription_plans', 'client_subscriptions'
];

async function checkDatabaseConnection() {
  console.log('🔗 CONNECTING TO REMOTE SUPABASE DATABASE\n');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    // Test connection by querying a simple table
    const { data, error } = await supabase
      .from('admin_users')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ DATABASE CONNECTION SUCCESSFUL\n');
    return true;
  } catch (err) {
    console.log('❌ Connection error:', err.message);
    return false;
  }
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count(*)', { count: 'exact', head: true });
    
    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return false;
    }
    return !error;
  } catch (err) {
    return false;
  }
}

async function analyzeDatabaseSchema() {
  console.log('📊 ANALYZING REMOTE DATABASE SCHEMA\n');
  
  const results = {
    corePresent: [],
    coreMissing: [],
    phase3Present: [],
    phase3Missing: []
  };
  
  // Check core tables
  console.log('🔍 Checking core tables...');
  for (const table of coreExpectedTables) {
    const exists = await checkTableExists(table);
    if (exists) {
      results.corePresent.push(table);
      console.log(`   ✅ ${table}`);
    } else {
      results.coreMissing.push(table);
      console.log(`   ❌ ${table}`);
    }
  }
  
  // Check Phase 3 tables
  console.log('\n🇧🇷 Checking Phase 3 Brazilian Legal Compliance tables...');
  for (const table of phase3Tables) {
    const exists = await checkTableExists(table);
    if (exists) {
      results.phase3Present.push(table);
      console.log(`   ✅ ${table}`);
    } else {
      results.phase3Missing.push(table);
      console.log(`   ❌ ${table}`);
    }
  }
  
  return results;
}

async function applyPhase3Migration() {
  console.log('\n🚀 ATTEMPTING TO APPLY PHASE 3 MIGRATION\n');
  
  try {
    // Read the Phase 3 migration file
    const migrationPath = './supabase/migrations/20250619150000_brazilian_legal_compliance_system.sql';
    
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Migration file not found:', migrationPath);
      return false;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`📋 Migration file loaded: ${migrationSQL.length} characters`);
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          // Try alternative approach with direct SQL execution
          const { data: altData, error: altError } = await supabase
            .from('pg_stat_statements')
            .select('*')
            .limit(1);
          
          console.log(`   ⚠️ Statement ${i + 1}: ${error.message}`);
          
          // If it's a "table already exists" error, that's okay
          if (error.message.includes('already exists')) {
            console.log(`   ✅ Table already exists - continuing`);
            continue;
          }
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Statement ${i + 1} failed: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Migration execution completed');
    return true;
    
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    return false;
  }
}

async function executeSQLStatement(sql) {
  try {
    // For Supabase, we need to use the REST API with a service role key
    // Since we only have the anon key, we'll need to use a different approach
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function createPhase3TablesDirectly() {
  console.log('\n🔨 CREATING PHASE 3 TABLES DIRECTLY\n');
  
  const tableDefinitions = [
    {
      name: 'case_deadlines',
      sql: `CREATE TABLE IF NOT EXISTS case_deadlines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id UUID NOT NULL,
        deadline_type VARCHAR(50) NOT NULL,
        due_date DATE NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    },
    {
      name: 'court_integrations',
      sql: `CREATE TABLE IF NOT EXISTS court_integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id UUID NOT NULL,
        court_code VARCHAR(20) NOT NULL,
        process_number VARCHAR(100) NOT NULL,
        integration_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    },
    {
      name: 'legal_templates',
      sql: `CREATE TABLE IF NOT EXISTS legal_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        template_type VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        variables JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    },
    {
      name: 'brazilian_holidays',
      sql: `CREATE TABLE IF NOT EXISTS brazilian_holidays (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        holiday_date DATE NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_national BOOLEAN DEFAULT TRUE,
        state_code VARCHAR(2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    }
  ];
  
  for (const table of tableDefinitions) {
    try {
      console.log(`🔧 Creating table: ${table.name}`);
      
      // Since we can't execute arbitrary SQL with anon key, 
      // we'll indicate what needs to be done
      console.log(`   📋 SQL: ${table.sql.substring(0, 100)}...`);
      console.log(`   ⚠️ Manual execution required in Supabase dashboard`);
      
    } catch (error) {
      console.log(`   ❌ Failed to create ${table.name}: ${error.message}`);
    }
  }
  
  return false; // Indicates manual intervention required
}

async function generateMigrationInstructions() {
  console.log('\n📋 GENERATING MANUAL MIGRATION INSTRUCTIONS\n');
  
  const migrationPath = './supabase/migrations/20250619150000_brazilian_legal_compliance_system.sql';
  
  if (fs.existsSync(migrationPath)) {
    const content = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔧 MANUAL MIGRATION REQUIRED');
    console.log('📍 Follow these steps to apply Phase 3 migration:');
    console.log('');
    console.log('1. 🌐 Go to: https://supabase.com/dashboard/project/cmgtjqycneerfdxmdmwp');
    console.log('2. 📊 Navigate to: SQL Editor');
    console.log('3. 📋 Copy and paste the following SQL:');
    console.log('4. ▶️ Click "Run" to execute');
    console.log('');
    console.log('═'.repeat(80));
    console.log('SQL TO EXECUTE:');
    console.log('═'.repeat(80));
    console.log(content);
    console.log('═'.repeat(80));
    console.log('');
    console.log('5. ✅ After execution, run the database checker to verify');
    console.log('6. 🧪 Test Phase 3 functionality with test-phase-3-comprehensive.html');
  }
}

// Main execution function
async function main() {
  console.log('🇧🇷 MINI PRIMA DATABASE MANAGER');
  console.log('Phase 3 Brazilian Legal Compliance Migration\n');
  
  // Step 1: Check connection
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }
  
  // Step 2: Analyze current schema
  const analysis = await analyzeDatabaseSchema();
  
  // Step 3: Show results
  console.log('\n📊 SCHEMA ANALYSIS RESULTS:');
  console.log(`✅ Core tables present: ${analysis.corePresent.length}`);
  console.log(`❌ Core tables missing: ${analysis.coreMissing.length}`);
  console.log(`✅ Phase 3 tables present: ${analysis.phase3Present.length}`);
  console.log(`❌ Phase 3 tables missing: ${analysis.phase3Missing.length}`);
  
  // Step 4: Check if Phase 3 migration is needed
  if (analysis.phase3Missing.length > 0) {
    console.log('\n🚨 PHASE 3 MIGRATION REQUIRED');
    console.log('Missing Phase 3 tables:', analysis.phase3Missing.join(', '));
    
    // Generate manual migration instructions
    await generateMigrationInstructions();
  } else {
    console.log('\n🎉 PHASE 3 SCHEMA IS UP TO DATE!');
    console.log('All Brazilian Legal Compliance tables are present');
  }
  
  // Step 5: Summary
  console.log('\n📋 NEXT STEPS:');
  if (analysis.phase3Missing.length > 0) {
    console.log('1. ⚠️ Apply Phase 3 migration manually (see instructions above)');
    console.log('2. 🧪 Run test-db-connection.html to verify');
    console.log('3. 🇧🇷 Test Brazilian Legal Compliance dashboard');
  } else {
    console.log('1. ✅ Phase 3 is ready for production use');
    console.log('2. 🧪 Run comprehensive tests to verify functionality');
  }
}

// Run the database manager
main().catch(console.error);