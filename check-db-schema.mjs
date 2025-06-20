// Database Schema Checker
// Compares remote Supabase database with application expectations

import { createClient } from '@supabase/supabase-js';

// Use environment variables directly (set in your .env file)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mxhwqijuobczchqrbxqr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aHdxaWp1b2JjemNocXJieHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg0OTc2NzAsImV4cCI6MjAzNDA3MzY3MH0.oFxtM0u5FXbnSjgZpvwCAmEKvB2Sj2KaAgvRgHl7I_k';

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected tables based on our application
const expectedTables = [
  // Core system tables
  'clients', 'cases', 'documents', 'staff', 'admin_users',
  'staff_client_assignments', 'portal_messages', 'portal_notifications',
  
  // Subscription system
  'subscription_plans', 'client_subscriptions', 'subscription_usage', 'service_types',
  'case_billing_config', 'payment_installments',
  
  // Financial management
  'suppliers', 'expense_categories', 'bills', 'invoices', 'payments',
  
  // Time tracking system
  'time_entries', 'active_timers', 'billing_rates', 'time_tracking_summaries',
  
  // Calendar & deadline system
  'court_dates', 'legal_deadlines', 'deadline_notifications', 'calendar_events',
  
  // PDF & document system
  'business_settings', 'document_templates', 'document_generations', 
  'business_files', 'google_auth_tokens',
  
  // Banking integration
  'banking_certificates', 'oauth_tokens', 'pix_payments', 'boleto_payments',
  'banking_accounts', 'payment_reconciliation',
  
  // Stripe integration
  'stripe_settings', 'stripe_products', 'stripe_customers', 'stripe_subscriptions',
  'stripe_payments', 'stripe_webhook_events', 'payment_tax_documents',
  
  // Brazilian legal compliance (Phase 3)
  'case_deadlines', 'deadline_notifications', 'court_integrations',
  'case_workflow_phases', 'oab_compliance_checks', 'legal_templates',
  'template_variables', 'brazilian_holidays'
];

async function checkDatabaseSchema() {
  console.log('🔍 CHECKING REMOTE DATABASE SCHEMA vs APPLICATION EXPECTATIONS\n');
  
  try {
    // Query to get all tables in the public schema
    const { data: tables, error } = await supabase.rpc('get_table_list');
    
    if (error) {
      // Fallback method using direct SQL query
      console.log('📋 Trying direct table query...');
      const { data: tablesData, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (tablesError) {
        console.error('❌ Error fetching tables:', tablesError);
        return;
      }
      
      const actualTables = tablesData?.map(t => t.tablename).sort() || [];
      await analyzeSchema(actualTables);
    } else {
      const actualTables = tables?.map(t => t.table_name).sort() || [];
      await analyzeSchema(actualTables);
    }
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.log('\n💡 Trying alternative method to check specific tables...');
    
    // Try to check specific tables by attempting to query them
    await checkSpecificTables();
  }
}

async function checkSpecificTables() {
  console.log('\n🎯 CHECKING SPECIFIC TABLES BY QUERYING...\n');
  
  const coreTableChecks = [
    'clients', 'cases', 'documents', 'staff', 'admin_users',
    'subscription_plans', 'time_entries', 'stripe_settings',
    'case_deadlines', 'court_integrations', 'legal_templates'
  ];
  
  const results = {
    present: [],
    missing: [],
    errors: []
  };
  
  for (const tableName of coreTableChecks) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          results.missing.push(tableName);
        } else {
          results.errors.push({ table: tableName, error: error.message });
        }
      } else {
        results.present.push(tableName);
      }
    } catch (err) {
      results.errors.push({ table: tableName, error: err.message });
    }
  }
  
  console.log('✅ TABLES CONFIRMED PRESENT:');
  results.present.forEach(table => console.log(`   - ${table}`));
  
  if (results.missing.length > 0) {
    console.log('\n❌ TABLES MISSING OR INACCESSIBLE:');
    results.missing.forEach(table => console.log(`   - ${table}`));
  }
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  TABLES WITH QUERY ERRORS:');
    results.errors.forEach(({ table, error }) => console.log(`   - ${table}: ${error}`));
  }
  
  // Check Phase 3 specifically
  console.log('\n🇧🇷 PHASE 3 BRAZILIAN LEGAL COMPLIANCE CHECK:');
  const phase3Tables = ['case_deadlines', 'court_integrations', 'legal_templates', 'brazilian_holidays'];
  const phase3Present = phase3Tables.filter(table => results.present.includes(table));
  const phase3Missing = phase3Tables.filter(table => results.missing.includes(table));
  
  if (phase3Present.length > 0) {
    console.log(`   ✅ Present: ${phase3Present.join(', ')}`);
  }
  if (phase3Missing.length > 0) {
    console.log(`   ❌ Missing: ${phase3Missing.join(', ')}`);
  }
  
  // Summary
  console.log(`\n📊 SUMMARY: ${results.present.length} confirmed, ${results.missing.length} missing, ${results.errors.length} errors`);
  
  if (results.missing.length > 0) {
    console.log('\n⚠️  RECOMMENDATION: Run database migrations to create missing tables');
    console.log('   Command: npx supabase db push (when Docker is available)');
  } else {
    console.log('\n🎉 CORE TABLES ARE PRESENT AND ACCESSIBLE!');
  }
}

async function analyzeSchema(actualTables) {
  console.log('📊 REMOTE DATABASE TABLES:');
  console.log(actualTables.join(', '));
  console.log(`\n📈 Total tables in remote database: ${actualTables.length}`);
  
  console.log('\n🎯 EXPECTED TABLES:');
  console.log(expectedTables.sort().join(', '));
  console.log(`\n📈 Total expected tables: ${expectedTables.length}`);
  
  // Check for missing tables
  const missingTables = expectedTables.filter(table => !actualTables.includes(table));
  const extraTables = actualTables.filter(table => !expectedTables.includes(table));
  
  console.log('\n🚨 SCHEMA COMPARISON RESULTS:');
  
  if (missingTables.length > 0) {
    console.log('\n❌ MISSING TABLES (Expected but not in remote DB):');
    missingTables.forEach(table => console.log(`   - ${table}`));
  } else {
    console.log('\n✅ All expected tables are present in remote database');
  }
  
  if (extraTables.length > 0) {
    console.log('\n⚠️  EXTRA TABLES (In remote DB but not expected):');
    extraTables.forEach(table => console.log(`   - ${table}`));
  }
  
  // Check Phase 3 tables specifically
  console.log('\n🇧🇷 PHASE 3 BRAZILIAN LEGAL COMPLIANCE TABLES:');
  const phase3Tables = [
    'case_deadlines', 'court_integrations', 'case_workflow_phases', 
    'oab_compliance_checks', 'legal_templates', 'brazilian_holidays'
  ];
  
  const phase3Present = phase3Tables.filter(table => actualTables.includes(table));
  const phase3Missing = phase3Tables.filter(table => !actualTables.includes(table));
  
  if (phase3Present.length > 0) {
    console.log(`   ✅ Present: ${phase3Present.join(', ')}`);
  }
  if (phase3Missing.length > 0) {
    console.log(`   ❌ Missing: ${phase3Missing.join(', ')}`);
  }
  
  // Summary
  console.log('\n📋 SCHEMA SYNC SUMMARY:');
  console.log(`   📊 Remote tables: ${actualTables.length}`);
  console.log(`   🎯 Expected tables: ${expectedTables.length}`);
  console.log(`   ❌ Missing tables: ${missingTables.length}`);
  console.log(`   ⚠️  Extra tables: ${extraTables.length}`);
  
  if (missingTables.length === 0) {
    console.log('\n🎉 DATABASE SCHEMA IS UP TO DATE!');
    console.log('✅ All expected tables are present in the remote database');
  } else {
    console.log('\n⚠️  DATABASE SCHEMA NEEDS UPDATES');
    console.log('❌ Some expected tables are missing from the remote database');
    console.log('\n💡 RECOMMENDED ACTION: Run database migrations to sync schema');
  }
}

// Run the check
checkDatabaseSchema();