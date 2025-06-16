// Quick script to apply the subscription management migration
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://cmgtjqycneerfdxmdmwp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabase() {
    console.log('🔗 Testing database connection...');
    
    try {
        // Test basic connection
        const { data, error } = await supabase.from('clients').select('count(*)', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Database connection successful');
        
        // Check if subscription_plans table exists
        const { data: plans, error: plansError } = await supabase
            .from('subscription_plans')
            .select('count(*)', { count: 'exact', head: true });
            
        if (plansError) {
            console.log('⚠️ subscription_plans table does not exist yet');
            console.log('Apply the SUBSCRIPTION_SCHEMA_MIGRATION.sql manually in Supabase SQL Editor');
        } else {
            console.log('✅ subscription_plans table exists');
            
            // Check for actual plans
            const { data: actualPlans, error: actualError } = await supabase
                .from('subscription_plans')
                .select('*')
                .limit(5);
                
            if (actualError) {
                console.log('❌ Error fetching plans:', actualError.message);
            } else {
                console.log(`✅ Found ${actualPlans.length} subscription plans`);
                actualPlans.forEach(plan => {
                    console.log(`  - ${plan.name} (${plan.tier}) - R$ ${plan.monthly_price}`);
                });
            }
        }
        
    } catch (error) {
        console.log('❌ Database error:', error.message);
    }
}

testDatabase();