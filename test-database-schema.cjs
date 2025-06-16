// Comprehensive Database Schema Testing
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://cmgtjqycneerfdxmdmwp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseSchema() {
    console.log('🧪 COMPREHENSIVE DATABASE SCHEMA TESTING');
    console.log('=' + '='.repeat(50));
    
    const tables = [
        'subscription_plans',
        'client_subscriptions', 
        'subscription_usage',
        'service_types',
        'case_billing_config',
        'payment_installments'
    ];
    
    let testResults = {
        passed: 0,
        failed: 0,
        details: []
    };
    
    for (const table of tables) {
        console.log(`\n📋 Testing table: ${table}`);
        console.log('-'.repeat(30));
        
        try {
            // Test 1: Table exists and is accessible
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
                
            if (error) {
                console.log(`❌ Table ${table}: ${error.message}`);
                testResults.failed++;
                testResults.details.push(`${table}: FAILED - ${error.message}`);
                continue;
            }
            
            console.log(`✅ Table ${table}: Accessible, ${count || 0} rows`);
            
            // Test 2: Get actual data sample
            const { data: sampleData, error: sampleError } = await supabase
                .from(table)
                .select('*')
                .limit(3);
                
            if (sampleError) {
                console.log(`⚠️ Table ${table}: Error fetching sample data - ${sampleError.message}`);
            } else {
                console.log(`📊 Sample data: ${sampleData.length} rows retrieved`);
                if (sampleData.length > 0) {
                    console.log(`🔍 Columns: ${Object.keys(sampleData[0]).join(', ')}`);
                }
            }
            
            testResults.passed++;
            testResults.details.push(`${table}: PASSED - ${count || 0} rows`);
            
        } catch (error) {
            console.log(`❌ Table ${table}: Exception - ${error.message}`);
            testResults.failed++;
            testResults.details.push(`${table}: EXCEPTION - ${error.message}`);
        }
    }
    
    // Test subscription plans specifically
    console.log(`\n🎯 DETAILED SUBSCRIPTION PLANS TESTING`);
    console.log('-'.repeat(40));
    
    try {
        const { data: plans, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('monthly_price');
            
        if (error) throw error;
        
        console.log(`📋 Found ${plans.length} active subscription plans:`);
        
        plans.forEach((plan, index) => {
            console.log(`\n${index + 1}. ${plan.name}`);
            console.log(`   💰 Price: R$ ${plan.monthly_price}/month`);
            console.log(`   🏷️ Tier: ${plan.tier}`);
            console.log(`   📂 Category: ${plan.category}`);
            console.log(`   ⏰ Consulting: ${plan.consulting_hours_quota}h/month`);
            console.log(`   📄 Documents: ${plan.document_review_quota}/month`);
            console.log(`   💬 Questions: ${plan.legal_questions_quota}/month`);
            console.log(`   💸 Litigation discount: ${plan.litigation_discount_percentage}%`);
        });
        
        // Validate expected plans
        const expectedPlans = [
            'Básico Trabalhista',
            'Profissional Trabalhista', 
            'Básico Empresarial',
            'Profissional Empresarial',
            'Empresarial Completo'
        ];
        
        const foundPlanNames = plans.map(p => p.name);
        const missingPlans = expectedPlans.filter(name => !foundPlanNames.includes(name));
        
        if (missingPlans.length === 0) {
            console.log(`\n✅ All expected subscription plans found!`);
            testResults.passed++;
        } else {
            console.log(`\n❌ Missing plans: ${missingPlans.join(', ')}`);
            testResults.failed++;
        }
        
    } catch (error) {
        console.log(`❌ Subscription plans test failed: ${error.message}`);
        testResults.failed++;
    }
    
    // Test RLS policies
    console.log(`\n🔒 TESTING ROW LEVEL SECURITY`);
    console.log('-'.repeat(30));
    
    try {
        // Test if anonymous user can read subscription plans (should work)
        const { data: publicPlans, error: publicError } = await supabase
            .from('subscription_plans')
            .select('name, monthly_price')
            .limit(1);
            
        if (publicError) {
            console.log(`❌ RLS Test (public access): ${publicError.message}`);
            testResults.failed++;
        } else {
            console.log(`✅ RLS Test (public access): Can read subscription plans`);
            testResults.passed++;
        }
        
    } catch (error) {
        console.log(`❌ RLS Test exception: ${error.message}`);
        testResults.failed++;
    }
    
    // Final results
    console.log(`\n📊 DATABASE TESTING RESULTS`);
    console.log('=' + '='.repeat(30));
    console.log(`✅ Tests Passed: ${testResults.passed}`);
    console.log(`❌ Tests Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    console.log(`\n📋 Detailed Results:`);
    testResults.details.forEach(detail => {
        const status = detail.includes('PASSED') ? '✅' : '❌';
        console.log(`${status} ${detail}`);
    });
    
    return testResults;
}

// Run the test
testDatabaseSchema().catch(console.error);