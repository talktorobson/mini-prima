// List all tables in the Supabase database
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://cmgtjqycneerfdxmdmwp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listAllTables() {
    console.log('🗄️ LISTING ALL DATABASE TABLES');
    console.log('=' + '='.repeat(50));
    
    // Try to get schema info using a known table query approach
    try {
        // Use rpc to call a function that lists tables
        const { data, error } = await supabase.rpc('list_tables');
        
        if (data) {
            console.log('Tables from RPC call:', data);
        } else if (error) {
            console.log('RPC method not available:', error.message);
        }
    } catch (e) {
        console.log('RPC approach failed, trying direct queries...');
    }
    
    // Try checking specific tables we know should exist
    const knownTables = [
        // Core tables
        'admin_users', 'staff', 'clients', 'cases', 'documents', 'financial_records',
        
        // Subscription tables
        'subscription_plans', 'client_subscriptions', 'subscription_usage', 
        'service_types', 'case_billing_config',
        
        // Financial tables (from our previous check)
        'suppliers', 'expense_categories', 'bills', 'invoices', 'invoice_line_items',
        'payments', 'payment_installments', 'financial_alerts', 'recurring_bill_templates',
        
        // Time tracking tables
        'time_entries', 'time_tracking_projects', 'time_sheets', 'billable_hours',
        
        // Dual invoice tables
        'dual_invoices', 'invoice_types', 'invoice_templates', 'invoice_configurations',
        
        // Banking integration tables (NEW)
        'pix_transactions', 'boletos', 'payment_reconciliation', 'banking_webhooks',
        'payment_methods', 'transaction_logs',
        
        // Other possible tables
        'portal_messages', 'notifications', 'audit_logs', 'file_uploads',
        'staff_permissions', 'client_registration_history', 'staff_client_assignments'
    ];
    
    let existingTables = [];
    let missingTables = [];
    
    console.log('\n🔍 CHECKING KNOWN TABLES');
    console.log('-'.repeat(40));
    
    for (const table of knownTables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
                
            if (error) {
                if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    console.log(`❌ ${table}`);
                    missingTables.push(table);
                } else {
                    console.log(`⚠️ ${table}: ${error.message}`);
                    existingTables.push({ name: table, count: 'error', error: error.message });
                }
            } else {
                console.log(`✅ ${table} (${count || 0} rows)`);
                existingTables.push({ name: table, count: count || 0 });
            }
        } catch (error) {
            console.log(`❌ ${table}: EXCEPTION - ${error.message}`);
            missingTables.push(table);
        }
    }
    
    // Try to get actual table schema info
    console.log('\n📋 TRYING TO GET ACTUAL SCHEMA INFO');
    console.log('-'.repeat(40));
    
    try {
        // Query information_schema if accessible
        const { data: schemaData, error: schemaError } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_type')
            .eq('table_schema', 'public');
            
        if (schemaData && !schemaError) {
            console.log('📊 Found schema information:');
            schemaData.forEach(table => {
                console.log(`   • ${table.table_name} (${table.table_type})`);
            });
        } else {
            console.log('❌ Could not access information_schema');
        }
    } catch (error) {
        console.log('❌ Schema query failed:', error.message);
    }
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('=' + '='.repeat(30));
    console.log(`✅ Existing tables: ${existingTables.length}`);
    console.log(`❌ Missing tables: ${missingTables.length}`);
    
    if (existingTables.length > 0) {
        console.log('\n✅ EXISTING TABLES:');
        existingTables.forEach(({ name, count, error }) => {
            if (error) {
                console.log(`   • ${name}: ERROR - ${error}`);
            } else {
                console.log(`   • ${name}: ${count} rows`);
            }
        });
    }
    
    if (missingTables.length > 0) {
        console.log('\n❌ MISSING TABLES:');
        missingTables.forEach(table => {
            console.log(`   • ${table}`);
        });
        
        // Group missing tables by category
        const categorizedMissing = {
            financial: missingTables.filter(t => ['suppliers', 'expense_categories', 'bills', 'invoices', 'financial_alerts', 'recurring_bill_templates'].includes(t)),
            timeTracking: missingTables.filter(t => ['time_entries', 'time_tracking_projects', 'time_sheets', 'billable_hours'].includes(t)),
            dualInvoice: missingTables.filter(t => ['dual_invoices', 'invoice_types', 'invoice_templates', 'invoice_configurations'].includes(t)),
            other: missingTables.filter(t => !['suppliers', 'expense_categories', 'bills', 'invoices', 'financial_alerts', 'recurring_bill_templates', 'time_entries', 'time_tracking_projects', 'time_sheets', 'billable_hours', 'dual_invoices', 'invoice_types', 'invoice_templates', 'invoice_configurations'].includes(t))
        };
        
        console.log('\n🏷️ MISSING BY CATEGORY:');
        if (categorizedMissing.financial.length > 0) {
            console.log(`   💰 Financial: ${categorizedMissing.financial.join(', ')}`);
        }
        if (categorizedMissing.timeTracking.length > 0) {
            console.log(`   ⏰ Time Tracking: ${categorizedMissing.timeTracking.join(', ')}`);
        }
        if (categorizedMissing.dualInvoice.length > 0) {
            console.log(`   📄 Dual Invoice: ${categorizedMissing.dualInvoice.join(', ')}`);
        }
        if (categorizedMissing.other.length > 0) {
            console.log(`   🔧 Other: ${categorizedMissing.other.join(', ')}`);
        }
    }
    
    return { existingTables, missingTables };
}

// Run the check
listAllTables().catch(console.error);