// Check Database Schema Data Integrity
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://cmgtjqycneerfdxmdmwp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchemaData() {
    console.log('📋 CHECKING SCHEMA DATA INTEGRITY');
    console.log('=' + '='.repeat(50));
    
    // Check expense categories (should have default data)
    console.log('\n💸 CHECKING EXPENSE CATEGORIES');
    console.log('-'.repeat(30));
    
    try {
        const { data: categories, error } = await supabase
            .from('expense_categories')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        console.log(`Found ${categories.length} expense categories:`);
        
        if (categories.length === 0) {
            console.log('❌ No expense categories found! Default data missing.');
            console.log('🔧 Need to apply default expense categories from migration.');
        } else {
            categories.forEach((cat, index) => {
                console.log(`${index + 1}. ${cat.name}`);
                console.log(`   📝 Description: ${cat.description || 'N/A'}`);
                console.log(`   💰 Tax Deductible: ${cat.is_tax_deductible ? 'Yes' : 'No'}`);
                console.log(`   🏷️ Accounting Code: ${cat.accounting_code || 'N/A'}`);
            });
        }
        
        // Check for expected categories
        const expectedCategories = [
            'Rent & Facilities',
            'Technology',
            'Professional Services',
            'Marketing & Business Development',
            'Travel & Transportation',
            'Office Supplies',
            'Insurance',
            'Wages & Benefits',
            'Banking & Financial',
            'Training & Education',
            'Court & Legal Fees',
            'Client Entertainment'
        ];
        
        const foundNames = categories.map(c => c.name);
        const missingCategories = expectedCategories.filter(name => !foundNames.includes(name));
        
        if (missingCategories.length === 0) {
            console.log('\n✅ All expected expense categories found!');
        } else {
            console.log(`\n❌ Missing expense categories: ${missingCategories.join(', ')}`);
        }
        
    } catch (error) {
        console.log(`❌ Error checking expense categories: ${error.message}`);
    }
    
    // Check service types (should have default data)
    console.log('\n⚖️ CHECKING SERVICE TYPES');
    console.log('-'.repeat(30));
    
    try {
        const { data: serviceTypes, error } = await supabase
            .from('service_types')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        console.log(`Found ${serviceTypes.length} service types:`);
        
        serviceTypes.forEach((service, index) => {
            console.log(`${index + 1}. ${service.name}`);
            console.log(`   📂 Category: ${service.category}`);
            console.log(`   ⚖️ Litigation Type: ${service.litigation_type || 'N/A'}`);
            console.log(`   💰 Minimum Fee: R$ ${service.minimum_fee || 0}`);
            console.log(`   ⏰ Hourly Rate: R$ ${service.default_hourly_rate || 0}`);
            console.log(`   📊 Percentage Rate: ${service.default_percentage_rate || 0}%`);
            console.log(`   💳 Payment Plans: ${service.allows_payment_plans ? 'Yes' : 'No'}`);
        });
        
    } catch (error) {
        console.log(`❌ Error checking service types: ${error.message}`);
    }
    
    // Check for functions and views
    console.log('\n🔧 CHECKING DATABASE FUNCTIONS AND VIEWS');
    console.log('-'.repeat(40));
    
    const expectedViews = [
        'financial_cash_flow_summary',
        'accounts_payable_aging',
        'accounts_receivable_aging',
        'monthly_financial_summary'
    ];
    
    for (const viewName of expectedViews) {
        try {
            const { data, error } = await supabase
                .from(viewName)
                .select('*')
                .limit(1);
                
            if (error) {
                if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    console.log(`❌ View ${viewName}: NOT FOUND`);
                } else {
                    console.log(`⚠️ View ${viewName}: ERROR - ${error.message}`);
                }
            } else {
                console.log(`✅ View ${viewName}: EXISTS`);
            }
        } catch (error) {
            console.log(`❌ View ${viewName}: EXCEPTION - ${error.message}`);
        }
    }
    
    // Check core database tables
    console.log('\n🗄️ CHECKING CORE SCHEMA TABLES');
    console.log('-'.repeat(30));
    
    const coreTables = [
        'admin_users',
        'staff', 
        'clients',
        'cases',
        'documents',
        'financial_records'
    ];
    
    for (const table of coreTables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
                
            if (error) {
                console.log(`❌ Table ${table}: ${error.message}`);
            } else {
                console.log(`✅ Table ${table}: EXISTS (${count || 0} rows)`);
            }
        } catch (error) {
            console.log(`❌ Table ${table}: EXCEPTION - ${error.message}`);
        }
    }
    
    // Check migration history
    console.log('\n📜 RECENT MIGRATIONS STATUS');
    console.log('-'.repeat(30));
    
    // Count tables by type
    const subscriptionTables = ['subscription_plans', 'client_subscriptions', 'subscription_usage'];
    const financialTables = ['suppliers', 'bills', 'invoices', 'payments'];
    const timeTrackingTables = ['time_entries', 'time_tracking_projects'];
    
    let tableStats = {
        subscription: 0,
        financial: 0,
        timeTracking: 0
    };
    
    for (const table of subscriptionTables) {
        try {
            const { error } = await supabase.from(table).select('*', { head: true });
            if (!error) tableStats.subscription++;
        } catch {}
    }
    
    for (const table of financialTables) {
        try {
            const { error } = await supabase.from(table).select('*', { head: true });
            if (!error) tableStats.financial++;
        } catch {}
    }
    
    for (const table of timeTrackingTables) {
        try {
            const { error } = await supabase.from(table).select('*', { head: true });
            if (!error) tableStats.timeTracking++;
        } catch {}
    }
    
    console.log(`📊 Schema Module Status:`);
    console.log(`   💳 Subscription Module: ${tableStats.subscription}/${subscriptionTables.length} tables (${tableStats.subscription === subscriptionTables.length ? '✅' : '❌'})`);
    console.log(`   💰 Financial Module: ${tableStats.financial}/${financialTables.length} tables (${tableStats.financial === financialTables.length ? '✅' : '❌'})`);
    console.log(`   ⏰ Time Tracking Module: ${tableStats.timeTracking}/${timeTrackingTables.length} tables (${tableStats.timeTracking === timeTrackingTables.length ? '✅' : '❌'})`);
    
    // Final recommendation
    console.log('\n🎯 RECOMMENDATIONS');
    console.log('-'.repeat(20));
    
    if (tableStats.subscription === subscriptionTables.length && 
        tableStats.financial === financialTables.length && 
        tableStats.timeTracking === timeTrackingTables.length) {
        console.log('✅ All major schema modules are present and working!');
        console.log('📋 Your database appears to be up-to-date with the latest migrations.');
    } else {
        console.log('⚠️ Some schema modules may be incomplete.');
        console.log('🔧 Consider running the missing migration scripts.');
    }
}

// Run the check
checkSchemaData().catch(console.error);