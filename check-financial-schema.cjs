// Check Financial Management Schema
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://cmgtjqycneerfdxmdmwp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkFinancialSchema() {
    console.log('💰 CHECKING FINANCIAL MANAGEMENT SCHEMA');
    console.log('=' + '='.repeat(50));
    
    // Expected financial tables from the migration files
    const expectedFinancialTables = [
        // From FINANCIAL_MANAGEMENT_SCHEMA_MIGRATION.sql
        'suppliers',
        'expense_categories', 
        'bills',
        'invoices',
        'invoice_line_items',
        'payments',
        'payment_installments', // Note: might conflict with subscription schema
        'financial_alerts',
        'recurring_bill_templates'
    ];
    
    // Expected time tracking tables (mentioned in question)
    const expectedTimeTrackingTables = [
        'time_entries',
        'time_tracking_projects',
        'time_sheets',
        'billable_hours'
    ];
    
    // All tables to check
    const allTablesToCheck = [...expectedFinancialTables, ...expectedTimeTrackingTables];
    
    let results = {
        existing: [],
        missing: [],
        errors: []
    };
    
    console.log('\n🔍 CHECKING FINANCIAL TABLES');
    console.log('-'.repeat(40));
    
    for (const table of allTablesToCheck) {
        try {
            console.log(`Checking table: ${table}...`);
            
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
                
            if (error) {
                if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    console.log(`❌ Table ${table}: NOT FOUND`);
                    results.missing.push(table);
                } else {
                    console.log(`⚠️ Table ${table}: ERROR - ${error.message}`);
                    results.errors.push({ table, error: error.message });
                }
                continue;
            }
            
            console.log(`✅ Table ${table}: EXISTS (${count || 0} rows)`);
            results.existing.push({ table, count: count || 0 });
            
            // Get schema info if table exists
            if (count !== null && count >= 0) {
                const { data: sampleData } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                    
                if (sampleData && sampleData.length > 0) {
                    const columns = Object.keys(sampleData[0]);
                    console.log(`   📊 Columns (${columns.length}): ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Table ${table}: EXCEPTION - ${error.message}`);
            results.errors.push({ table, error: error.message });
        }
    }
    
    // Check for dual-invoice related tables
    console.log('\n🔍 CHECKING FOR DUAL-INVOICE TABLES');
    console.log('-'.repeat(40));
    
    const dualInvoiceTables = [
        'dual_invoices',
        'invoice_types',
        'invoice_templates',
        'invoice_configurations'
    ];
    
    for (const table of dualInvoiceTables) {
        try {
            const { error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
                
            if (error) {
                if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    console.log(`❌ Table ${table}: NOT FOUND`);
                    results.missing.push(table);
                } else {
                    console.log(`⚠️ Table ${table}: ERROR - ${error.message}`);
                }
            } else {
                console.log(`✅ Table ${table}: EXISTS`);
                results.existing.push({ table, count: 0 });
            }
        } catch (error) {
            console.log(`❌ Table ${table}: EXCEPTION - ${error.message}`);
        }
    }
    
    // Summary
    console.log('\n📊 FINANCIAL SCHEMA STATUS SUMMARY');
    console.log('=' + '='.repeat(40));
    console.log(`✅ Existing tables: ${results.existing.length}`);
    console.log(`❌ Missing tables: ${results.missing.length}`);
    console.log(`⚠️ Errors: ${results.errors.length}`);
    
    if (results.existing.length > 0) {
        console.log('\n✅ EXISTING TABLES:');
        results.existing.forEach(({ table, count }) => {
            console.log(`   • ${table} (${count} rows)`);
        });
    }
    
    if (results.missing.length > 0) {
        console.log('\n❌ MISSING TABLES:');
        results.missing.forEach(table => {
            console.log(`   • ${table}`);
        });
    }
    
    if (results.errors.length > 0) {
        console.log('\n⚠️ ERRORS:');
        results.errors.forEach(({ table, error }) => {
            console.log(`   • ${table}: ${error}`);
        });
    }
    
    // Check if we need to apply the financial schema
    const criticalFinancialTables = ['suppliers', 'bills', 'invoices', 'payments'];
    const missingCriticalTables = criticalFinancialTables.filter(table => 
        results.missing.includes(table)
    );
    
    if (missingCriticalTables.length > 0) {
        console.log('\n🚨 CRITICAL MISSING TABLES DETECTED!');
        console.log('   The following core financial tables are missing:');
        missingCriticalTables.forEach(table => {
            console.log(`   • ${table}`);
        });
        console.log('\n   🔧 RECOMMENDED ACTION: Apply FINANCIAL_MANAGEMENT_SCHEMA_MIGRATION.sql');
    } else {
        console.log('\n✅ All critical financial tables are present!');
    }
    
    return results;
}

// Run the check
checkFinancialSchema().catch(console.error);