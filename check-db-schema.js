// Database Schema Checker
// Compares remote Supabase database with application expectations

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

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
    // Get all tables from the database
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.error('❌ Error fetching tables:', error);
      return;
    }

    const actualTables = tables.map(t => t.table_name).sort();
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
    
    // Check RLS policies for key tables
    console.log('\n🔒 CHECKING ROW LEVEL SECURITY POLICIES:');
    
    const keyTables = ['clients', 'cases', 'documents', 'time_entries', 'stripe_payments', 'case_deadlines'];
    
    for (const tableName of keyTables) {
      if (actualTables.includes(tableName)) {
        try {
          const { data: policies } = await supabase
            .from('pg_policies')
            .select('policyname, cmd')
            .eq('tablename', tableName);
          
          if (policies && policies.length > 0) {
            console.log(`   ✅ ${tableName}: ${policies.length} RLS policies active`);
          } else {
            console.log(`   ⚠️  ${tableName}: No RLS policies found`);
          }
        } catch (err) {
          console.log(`   ❌ ${tableName}: Error checking RLS policies`);
        }
      }
    }
    
    // Check if specific Phase 3 tables exist
    console.log('\n🇧🇷 PHASE 3 BRAZILIAN LEGAL COMPLIANCE TABLES:');
    const phase3Tables = [
      'case_deadlines', 'court_integrations', 'case_workflow_phases', 
      'oab_compliance_checks', 'legal_templates', 'brazilian_holidays'
    ];
    
    const phase3Present = phase3Tables.filter(table => actualTables.includes(table));
    const phase3Missing = phase3Tables.filter(table => !actualTables.includes(table));
    
    console.log(`   ✅ Present: ${phase3Present.join(', ')}`);
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
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  }
}

// Run the check
checkDatabaseSchema();