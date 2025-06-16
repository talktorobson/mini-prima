// Final Definitive Schema Check
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://cmgtjqycneerfdxmdmwp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function finalSchemaCheck() {
    console.log('🔍 FINAL DEFINITIVE SCHEMA CHECK');
    console.log('=' + '='.repeat(50));
    
    // Test the specific tables mentioned in the user's question
    const targetTables = {
        // Financial Management (phase8.10.1)
        financial: [
            'suppliers',
            'expense_categories', 
            'bills',
            'invoices',
            'invoice_line_items',
            'payments',
            'payment_installments',
            'financial_alerts',
            'recurring_bill_templates'
        ],
        
        // Time Tracking (phase8.6.1)
        timeTracking: [
            'time_entries',
            'time_tracking_projects',
            'time_sheets',
            'billable_hours'
        ],
        
        // Dual Invoice (phase8.7.1)
        dualInvoice: [
            'dual_invoices',
            'invoice_types', 
            'invoice_templates',
            'invoice_configurations'
        ],
        
        // Already confirmed working
        subscription: [
            'subscription_plans',
            'client_subscriptions',
            'subscription_usage',
            'service_types',
            'case_billing_config'
        ],
        
        // Core system
        core: [
            'admin_users',
            'staff',
            'clients', 
            'cases',
            'documents',
            'financial_records'
        ]
    };
    
    let results = {};
    
    for (const [category, tables] of Object.entries(targetTables)) {
        console.log(`\n📋 CHECKING ${category.toUpperCase()} TABLES`);
        console.log('-'.repeat(40));
        
        results[category] = {
            existing: [],
            missing: [],
            total: tables.length
        };
        
        for (const table of tables) {
            try {
                const { data, error, count } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                    
                if (error) {
                    if (error.message.includes('relation') && error.message.includes('does not exist')) {
                        console.log(`❌ ${table}: NOT FOUND`);
                        results[category].missing.push(table);
                    } else {
                        console.log(`⚠️ ${table}: ERROR - ${error.message}`);
                        results[category].missing.push(table);
                    }
                } else {
                    console.log(`✅ ${table}: EXISTS (${count || 0} rows)`);
                    results[category].existing.push({ table, count: count || 0 });
                }
            } catch (error) {
                console.log(`❌ ${table}: EXCEPTION - ${error.message}`);
                results[category].missing.push(table);
            }
        }
    }
    
    // Summary by category
    console.log('\n📊 SCHEMA STATUS BY CATEGORY');
    console.log('=' + '='.repeat(40));
    
    Object.entries(results).forEach(([category, result]) => {
        const percentage = Math.round((result.existing.length / result.total) * 100);
        const status = percentage === 100 ? '✅' : percentage > 0 ? '⚠️' : '❌';
        
        console.log(`\n${status} ${category.toUpperCase()}: ${result.existing.length}/${result.total} tables (${percentage}%)`);
        
        if (result.missing.length > 0) {
            console.log(`   Missing: ${result.missing.join(', ')}`);
        }
        
        if (result.existing.length > 0) {
            const withData = result.existing.filter(t => t.count > 0);
            console.log(`   Tables with data: ${withData.length}/${result.existing.length}`);
        }
    });
    
    // Migration file recommendations
    console.log('\n🔧 MIGRATION RECOMMENDATIONS');
    console.log('=' + '='.repeat(30));
    
    if (results.financial.missing.length > 0) {
        console.log('❌ FINANCIAL_MANAGEMENT_SCHEMA_MIGRATION.sql needs to be applied');
        console.log('   Missing tables:', results.financial.missing.join(', '));
    } else {
        console.log('✅ Financial management schema is complete');
    }
    
    if (results.timeTracking.missing.length > 0) {
        console.log('❌ Time tracking schema (phase8.6.1) needs to be applied');
        console.log('   Missing tables:', results.timeTracking.missing.join(', '));
    } else {
        console.log('✅ Time tracking schema is complete');
    }
    
    if (results.dualInvoice.missing.length > 0) {
        console.log('❌ Dual invoice schema (phase8.7.1) needs to be applied');
        console.log('   Missing tables:', results.dualInvoice.missing.join(', '));
    } else {
        console.log('✅ Dual invoice schema is complete');
    }
    
    if (results.subscription.missing.length > 0) {
        console.log('❌ Subscription schema needs attention');
        console.log('   Missing tables:', results.subscription.missing.join(', '));
    } else {
        console.log('✅ Subscription schema is complete');
    }
    
    // Overall assessment
    const totalTables = Object.values(results).reduce((sum, r) => sum + r.total, 0);
    const existingTables = Object.values(results).reduce((sum, r) => sum + r.existing.length, 0);
    const overallPercentage = Math.round((existingTables / totalTables) * 100);
    
    console.log('\n🎯 OVERALL DATABASE STATUS');
    console.log('=' + '='.repeat(30));
    console.log(`📊 Schema Completion: ${existingTables}/${totalTables} tables (${overallPercentage}%)`);
    
    if (overallPercentage === 100) {
        console.log('🎉 All schemas are complete and ready!');
    } else if (overallPercentage >= 75) {
        console.log('⚠️ Most schemas are complete, minor migrations needed');
    } else {
        console.log('❌ Major schema migrations required');
    }
    
    console.log('\n📋 IMMEDIATE NEXT STEPS:');
    
    if (results.financial.missing.length > 0) {
        console.log('1. 🔧 Apply FINANCIAL_MANAGEMENT_SCHEMA_MIGRATION.sql');
    }
    
    if (results.timeTracking.missing.length > 0) {
        console.log('2. 🔧 Apply time tracking schema migration');
    }
    
    if (results.dualInvoice.missing.length > 0) {
        console.log('3. 🔧 Apply dual invoice schema migration');
    }
    
    if (results.financial.missing.length === 0 && 
        results.timeTracking.missing.length === 0 && 
        results.dualInvoice.missing.length === 0) {
        console.log('1. ✅ All schemas are applied!');
        console.log('2. 🔧 Populate default data (expense categories, etc.)');
        console.log('3. 🔧 Test financial views and functions');
        console.log('4. 🔧 Run application integration tests');
    }
    
    return results;
}

// Run the final check
finalSchemaCheck().catch(console.error);