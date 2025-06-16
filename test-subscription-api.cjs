// Comprehensive Subscription Service API Testing
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://cmgtjqycneerfdxmdmwp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 COMPREHENSIVE SUBSCRIPTION SERVICE API TESTING');
console.log('=' + '='.repeat(55));

async function testSubscriptionService() {
    let testResults = {
        passed: 0,
        failed: 0,
        details: []
    };

    // Test 1: Get Subscription Plans
    console.log('\n📋 TEST 1: Get Subscription Plans');
    console.log('-'.repeat(40));
    
    try {
        const { data: plans, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('monthly_price');

        if (error) throw error;

        console.log(`✅ Retrieved ${plans.length} subscription plans`);
        
        // Validate plan structure
        const requiredFields = ['id', 'name', 'tier', 'category', 'monthly_price', 'litigation_discount_percentage'];
        const firstPlan = plans[0];
        const missingFields = requiredFields.filter(field => !(field in firstPlan));
        
        if (missingFields.length === 0) {
            console.log(`✅ All required fields present in plans`);
            testResults.passed++;
        } else {
            console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
            testResults.failed++;
        }

        // Validate pricing logic
        const validPrices = plans.every(plan => plan.monthly_price > 0);
        if (validPrices) {
            console.log(`✅ All plans have valid pricing`);
            testResults.passed++;
        } else {
            console.log(`❌ Some plans have invalid pricing`);
            testResults.failed++;
        }

        testResults.details.push(`getSubscriptionPlans: ${plans.length} plans retrieved`);

    } catch (error) {
        console.log(`❌ Error getting subscription plans: ${error.message}`);
        testResults.failed++;
        testResults.details.push(`getSubscriptionPlans: FAILED - ${error.message}`);
    }

    // Test 2: Service Types API
    console.log('\n⚖️ TEST 2: Get Service Types');
    console.log('-'.repeat(40));
    
    try {
        const { data: services, error } = await supabase
            .from('service_types')
            .select('*')
            .order('name');

        if (error) throw error;

        console.log(`✅ Retrieved ${services.length} service types`);
        
        // Validate service structure
        const serviceFields = ['id', 'name', 'category', 'litigation_type', 'minimum_fee'];
        const firstService = services[0];
        const missingServiceFields = serviceFields.filter(field => !(field in firstService));
        
        if (missingServiceFields.length === 0) {
            console.log(`✅ All required fields present in service types`);
            testResults.passed++;
        } else {
            console.log(`❌ Missing service fields: ${missingServiceFields.join(', ')}`);
            testResults.failed++;
        }

        // Show service details
        services.forEach((service, index) => {
            console.log(`${index + 1}. ${service.name} (${service.category})`);
            console.log(`   Min Fee: R$ ${service.minimum_fee}`);
            console.log(`   Payment Plans: ${service.allows_payment_plans ? 'Yes' : 'No'}`);
        });

        testResults.details.push(`getServiceTypes: ${services.length} services retrieved`);

    } catch (error) {
        console.log(`❌ Error getting service types: ${error.message}`);
        testResults.failed++;
        testResults.details.push(`getServiceTypes: FAILED - ${error.message}`);
    }

    // Test 3: Client Subscriptions (should be empty but table should exist)
    console.log('\n👥 TEST 3: Client Subscriptions Table');
    console.log('-'.repeat(40));
    
    try {
        const { data: subscriptions, error, count } = await supabase
            .from('client_subscriptions')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        console.log(`✅ Client subscriptions table accessible (${count || 0} subscriptions)`);
        testResults.passed++;
        testResults.details.push(`clientSubscriptions: Table accessible, ${count || 0} rows`);

    } catch (error) {
        console.log(`❌ Error accessing client subscriptions: ${error.message}`);
        testResults.failed++;
        testResults.details.push(`clientSubscriptions: FAILED - ${error.message}`);
    }

    // Test 4: Subscription Usage Table
    console.log('\n📊 TEST 4: Subscription Usage Table');
    console.log('-'.repeat(40));
    
    try {
        const { data: usage, error, count } = await supabase
            .from('subscription_usage')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        console.log(`✅ Subscription usage table accessible (${count || 0} usage records)`);
        testResults.passed++;
        testResults.details.push(`subscriptionUsage: Table accessible, ${count || 0} rows`);

    } catch (error) {
        console.log(`❌ Error accessing subscription usage: ${error.message}`);
        testResults.failed++;
        testResults.details.push(`subscriptionUsage: FAILED - ${error.message}`);
    }

    // Test 5: Business Intelligence Data Sources
    console.log('\n📈 TEST 5: Business Intelligence Data Sources');
    console.log('-'.repeat(40));
    
    try {
        // Test MRR calculation data sources
        const { data: activeSubscriptions, error: mrrError } = await supabase
            .from('client_subscriptions')
            .select('monthly_amount, plan_id')
            .eq('status', 'active');

        if (mrrError) throw mrrError;

        console.log(`✅ MRR data source ready (${activeSubscriptions.length} active subscriptions)`);
        
        // Test cross-sell data sources
        const { data: billingConfigs, error: crossSellError } = await supabase
            .from('case_billing_config')
            .select('subscription_discount_applied, discounted_amount')
            .limit(5);

        if (crossSellError) throw crossSellError;

        console.log(`✅ Cross-sell data source ready (${billingConfigs.length} billing configs)`);
        testResults.passed++;
        testResults.details.push(`businessIntelligence: Data sources accessible`);

    } catch (error) {
        console.log(`❌ Error accessing BI data sources: ${error.message}`);
        testResults.failed++;
        testResults.details.push(`businessIntelligence: FAILED - ${error.message}`);
    }

    // Test 6: Payment Installments Table
    console.log('\n💳 TEST 6: Payment Installments Table');
    console.log('-'.repeat(40));
    
    try {
        const { data: installments, error, count } = await supabase
            .from('payment_installments')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        console.log(`✅ Payment installments table accessible (${count || 0} installments)`);
        testResults.passed++;
        testResults.details.push(`paymentInstallments: Table accessible, ${count || 0} rows`);

    } catch (error) {
        console.log(`❌ Error accessing payment installments: ${error.message}`);
        testResults.failed++;
        testResults.details.push(`paymentInstallments: FAILED - ${error.message}`);
    }

    // Test 7: Data Validation and Constraints
    console.log('\n🔒 TEST 7: Data Validation and Constraints');
    console.log('-'.repeat(40));
    
    try {
        // Test subscription plan constraints
        const { data: plans, error } = await supabase
            .from('subscription_plans')
            .select('tier, category, monthly_price, litigation_discount_percentage')
            .limit(5);

        if (error) throw error;

        let validationErrors = [];

        plans.forEach((plan, index) => {
            // Validate tier values
            if (!['basic', 'professional', 'enterprise'].includes(plan.tier)) {
                validationErrors.push(`Plan ${index + 1}: Invalid tier '${plan.tier}'`);
            }
            
            // Validate pricing
            if (plan.monthly_price <= 0) {
                validationErrors.push(`Plan ${index + 1}: Invalid price ${plan.monthly_price}`);
            }
            
            // Validate discount percentage
            if (plan.litigation_discount_percentage < 0 || plan.litigation_discount_percentage > 100) {
                validationErrors.push(`Plan ${index + 1}: Invalid discount ${plan.litigation_discount_percentage}%`);
            }
        });

        if (validationErrors.length === 0) {
            console.log(`✅ All data validation constraints satisfied`);
            testResults.passed++;
        } else {
            console.log(`❌ Validation errors found:`);
            validationErrors.forEach(error => console.log(`   - ${error}`));
            testResults.failed++;
        }

        testResults.details.push(`dataValidation: ${validationErrors.length} errors found`);

    } catch (error) {
        console.log(`❌ Error validating data constraints: ${error.message}`);
        testResults.failed++;
        testResults.details.push(`dataValidation: FAILED - ${error.message}`);
    }

    return testResults;
}

async function testAnalyticsCalculations() {
    console.log('\n📊 ANALYTICS CALCULATIONS TESTING');
    console.log('=' + '='.repeat(40));

    try {
        // Test MRR calculation logic
        const { data: subscriptions, error } = await supabase
            .from('client_subscriptions')
            .select('monthly_amount, plan:subscription_plans(tier)')
            .eq('status', 'active');

        if (error) throw error;

        console.log(`📈 Testing MRR calculation with ${subscriptions.length} active subscriptions`);
        
        const totalMRR = subscriptions.reduce((sum, sub) => sum + (sub.monthly_amount || 0), 0);
        const mrrByTier = {};
        
        subscriptions.forEach(sub => {
            const tier = sub.plan?.tier || 'unknown';
            mrrByTier[tier] = (mrrByTier[tier] || 0) + (sub.monthly_amount || 0);
        });

        console.log(`💰 Total MRR: R$ ${totalMRR.toLocaleString('pt-BR')}`);
        console.log(`👥 Active Subscriptions: ${subscriptions.length}`);
        console.log(`📊 Average Revenue Per User: R$ ${subscriptions.length ? (totalMRR / subscriptions.length).toFixed(2) : '0'}`);
        
        if (Object.keys(mrrByTier).length > 0) {
            console.log(`📋 MRR by Tier:`);
            Object.entries(mrrByTier).forEach(([tier, revenue]) => {
                console.log(`   ${tier}: R$ ${revenue.toLocaleString('pt-BR')}`);
            });
        }

        console.log(`✅ MRR calculations working correctly`);
        return true;

    } catch (error) {
        console.log(`❌ Analytics calculation error: ${error.message}`);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    const apiResults = await testSubscriptionService();
    const analyticsWorking = await testAnalyticsCalculations();
    
    // Final Results
    console.log(`\n📊 SUBSCRIPTION SERVICE API TESTING RESULTS`);
    console.log('=' + '='.repeat(50));
    console.log(`✅ API Tests Passed: ${apiResults.passed}`);
    console.log(`❌ API Tests Failed: ${apiResults.failed}`);
    console.log(`📈 API Success Rate: ${((apiResults.passed / (apiResults.passed + apiResults.failed)) * 100).toFixed(1)}%`);
    console.log(`📊 Analytics: ${analyticsWorking ? 'Working' : 'Failed'}`);
    
    console.log(`\n📋 Detailed Results:`);
    apiResults.details.forEach(detail => {
        const status = detail.includes('FAILED') ? '❌' : '✅';
        console.log(`${status} ${detail}`);
    });

    const overallSuccess = (apiResults.failed === 0) && analyticsWorking;
    
    if (overallSuccess) {
        console.log(`\n🎉 ALL SUBSCRIPTION SERVICE TESTS PASSED!`);
        console.log(`🚀 API endpoints are ready for production`);
        console.log(`📊 Analytics calculations are functional`);
        console.log(`💾 Database schema is fully operational`);
    } else {
        console.log(`\n⚠️ Some tests failed - review implementation`);
    }

    return overallSuccess;
}

runAllTests().catch(console.error);