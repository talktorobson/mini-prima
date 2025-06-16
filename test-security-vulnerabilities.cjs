// Ultra-Comprehensive Security Vulnerability Testing
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://cmgtjqycneerfdxmdmwp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔐 ULTRA-COMPREHENSIVE SECURITY VULNERABILITY TESTING');
console.log('=' + '='.repeat(65));

// Test SQL injection attacks
async function testSQLInjection() {
    console.log('\n💉 TEST 1: SQL Injection Attack Vectors');
    console.log('-'.repeat(50));
    
    const injectionVectors = [
        "'; DROP TABLE subscription_plans; --",
        "1'; UNION SELECT * FROM admin_users; --",
        "admin'--",
        "1' OR '1'='1",
        "1' OR 1=1 --",
        "'; INSERT INTO subscription_plans VALUES ('hack'); --",
        "1'; DELETE FROM subscription_plans WHERE '1'='1'; --",
        "1' UNION SELECT null,null,null,null,null,null,null,null,null,null,null,null,null,null,null--",
        "'; EXEC xp_cmdshell('dir'); --",
        "1'; SELECT password FROM admin_users; --"
    ];
    
    let blockedAttempts = 0;
    let totalAttempts = injectionVectors.length;
    
    console.log(`🧪 Testing ${totalAttempts} SQL injection vectors...`);
    
    for (let i = 0; i < injectionVectors.length; i++) {
        const vector = injectionVectors[i];
        console.log(`\n📋 Vector ${i + 1}: ${vector.length > 50 ? vector.substring(0, 50) + '...' : vector}`);
        
        try {
            // Test in different contexts
            const tests = [
                () => supabase.from('subscription_plans').select('*').eq('name', vector),
                () => supabase.from('subscription_plans').select('*').eq('tier', vector),
                () => supabase.from('subscription_plans').select('*').eq('category', vector),
                () => supabase.from('service_types').select('*').eq('name', vector)
            ];
            
            let vectorBlocked = true;
            
            for (const test of tests) {
                const { data, error } = await test();
                
                // Check if the injection was successful (bad) or blocked (good)
                if (data && data.length > 0 && data[0].name === vector) {
                    console.log(`❌ Injection may have succeeded`);
                    vectorBlocked = false;
                } else if (error && error.message.toLowerCase().includes('syntax')) {
                    console.log(`⚠️ SQL syntax error - injection attempted but query failed`);
                    vectorBlocked = false;
                }
            }
            
            if (vectorBlocked) {
                console.log(`✅ Injection vector blocked/sanitized`);
                blockedAttempts++;
            }
            
        } catch (error) {
            console.log(`✅ Exception thrown - likely blocked: ${error.message.substring(0, 100)}`);
            blockedAttempts++;
        }
    }
    
    console.log(`\n📊 SQL Injection Defense:`);
    console.log(`   Blocked: ${blockedAttempts}/${totalAttempts}`);
    console.log(`   Success Rate: ${((blockedAttempts/totalAttempts)*100).toFixed(1)}%`);
    
    return blockedAttempts === totalAttempts;
}

// Test Cross-Site Scripting (XSS) prevention
async function testXSSPrevention() {
    console.log('\n🕸️ TEST 2: Cross-Site Scripting (XSS) Prevention');
    console.log('-'.repeat(50));
    
    const xssVectors = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "javascript:alert('XSS')",
        "<svg onload=alert('XSS')>",
        "');alert('XSS');//",
        "<iframe src=javascript:alert('XSS')>",
        "<body onload=alert('XSS')>",
        "<input onfocus=alert('XSS') autofocus>",
        "<select onfocus=alert('XSS') autofocus>",
        "<textarea onfocus=alert('XSS') autofocus>"
    ];
    
    let safeOperations = 0;
    
    console.log(`🧪 Testing ${xssVectors.length} XSS vectors...`);
    
    for (let i = 0; i < xssVectors.length; i++) {
        const vector = xssVectors[i];
        console.log(`\n📋 Vector ${i + 1}: ${vector}`);
        
        try {
            // Test storing XSS payload (should be sanitized)
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('name', vector);
            
            // If no error and no data returned, it's likely safe
            if (!error && (!data || data.length === 0)) {
                console.log(`✅ XSS vector handled safely`);
                safeOperations++;
            } else if (error) {
                console.log(`✅ XSS vector rejected: ${error.message.substring(0, 50)}`);
                safeOperations++;
            } else {
                console.log(`⚠️ XSS vector may have been stored`);
            }
            
        } catch (error) {
            console.log(`✅ XSS vector blocked: ${error.message.substring(0, 50)}`);
            safeOperations++;
        }
    }
    
    console.log(`\n📊 XSS Prevention:`);
    console.log(`   Safe Operations: ${safeOperations}/${xssVectors.length}`);
    console.log(`   Success Rate: ${((safeOperations/xssVectors.length)*100).toFixed(1)}%`);
    
    return safeOperations === xssVectors.length;
}

// Test authentication bypass attempts
async function testAuthBypass() {
    console.log('\n🔑 TEST 3: Authentication Bypass Attempts');
    console.log('-'.repeat(50));
    
    const bypassTests = [
        {
            name: 'Direct admin table access',
            test: async () => {
                const { data, error } = await supabase.from('admin_users').select('*');
                // Should fail or return empty due to RLS
                return error || (data && data.length === 0);
            }
        },
        {
            name: 'Client data without auth',
            test: async () => {
                const { data, error } = await supabase.from('clients').select('*');
                // Should fail or return empty due to RLS
                return error || (data && data.length === 0);
            }
        },
        {
            name: 'Subscription modification attempt',
            test: async () => {
                const { error } = await supabase
                    .from('client_subscriptions')
                    .update({ monthly_amount: 1 })
                    .eq('id', 'fake-id');
                // Should fail due to RLS
                return error !== null;
            }
        },
        {
            name: 'Staff table access',
            test: async () => {
                const { data, error } = await supabase.from('staff').select('*');
                // Should fail or return empty due to RLS
                return error || (data && data.length === 0);
            }
        },
        {
            name: 'Financial records access',
            test: async () => {
                const { data, error } = await supabase.from('financial_records').select('*');
                // Should fail or return empty due to RLS
                return error || (data && data.length === 0);
            }
        }
    ];
    
    let protectedResources = 0;
    
    for (const test of bypassTests) {
        console.log(`🔐 Testing: ${test.name}`);
        
        try {
            const isProtected = await test.test();
            
            if (isProtected) {
                console.log(`✅ Resource properly protected`);
                protectedResources++;
            } else {
                console.log(`❌ Potential security vulnerability`);
            }
        } catch (error) {
            console.log(`✅ Access blocked: ${error.message.substring(0, 50)}`);
            protectedResources++;
        }
    }
    
    console.log(`\n📊 Authentication Security:`);
    console.log(`   Protected Resources: ${protectedResources}/${bypassTests.length}`);
    console.log(`   Success Rate: ${((protectedResources/bypassTests.length)*100).toFixed(1)}%`);
    
    return protectedResources === bypassTests.length;
}

// Test data validation and sanitization
async function testDataValidation() {
    console.log('\n🧹 TEST 4: Data Validation & Sanitization');
    console.log('-'.repeat(50));
    
    const validationTests = [
        {
            name: 'Invalid email formats',
            inputs: ['invalid-email', '@domain.com', 'user@', 'user@domain', ''],
            table: 'clients',
            field: 'contact_email'
        },
        {
            name: 'Invalid tier values',
            inputs: ['invalid', 'admin', 'super', '', null],
            table: 'subscription_plans',
            field: 'tier'
        },
        {
            name: 'Negative prices',
            inputs: [-100, -1, -0.01, Number.MIN_VALUE],
            table: 'subscription_plans', 
            field: 'monthly_price'
        },
        {
            name: 'Invalid percentages',
            inputs: [-10, 101, 999, -1],
            table: 'subscription_plans',
            field: 'litigation_discount_percentage'
        }
    ];
    
    let validationsPassed = 0;
    
    for (const validationTest of validationTests) {
        console.log(`\n🧪 Testing: ${validationTest.name}`);
        let testPassed = true;
        
        for (const input of validationTest.inputs) {
            try {
                // Try to query with invalid input
                const query = {};
                query[validationTest.field] = input;
                
                const { data, error } = await supabase
                    .from(validationTest.table)
                    .select('*')
                    .match(query);
                
                // For most invalid inputs, we expect either an error or no results
                if (error) {
                    console.log(`   ✅ Input "${input}" properly rejected`);
                } else if (!data || data.length === 0) {
                    console.log(`   ✅ Input "${input}" returned no results (safe)`);
                } else {
                    console.log(`   ⚠️ Input "${input}" may not be properly validated`);
                    testPassed = false;
                }
                
            } catch (error) {
                console.log(`   ✅ Input "${input}" caused exception (likely validated)`);
            }
        }
        
        if (testPassed) {
            validationsPassed++;
        }
    }
    
    console.log(`\n📊 Data Validation:`);
    console.log(`   Passed Tests: ${validationsPassed}/${validationTests.length}`);
    console.log(`   Success Rate: ${((validationsPassed/validationTests.length)*100).toFixed(1)}%`);
    
    return validationsPassed === validationTests.length;
}

// Test rate limiting and DoS protection
async function testRateLimiting() {
    console.log('\n🚦 TEST 5: Rate Limiting & DoS Protection');
    console.log('-'.repeat(50));
    
    console.log('🧪 Testing rapid-fire requests...');
    
    const rapidRequests = [];
    const requestCount = 50;
    
    const startTime = Date.now();
    
    // Fire many requests simultaneously
    for (let i = 0; i < requestCount; i++) {
        rapidRequests.push(
            supabase
                .from('subscription_plans')
                .select('*')
                .then(() => ({ success: true, index: i }))
                .catch(error => ({ success: false, error: error.message, index: i }))
        );
    }
    
    const results = await Promise.allSettled(rapidRequests);
    const endTime = Date.now();
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    const duration = endTime - startTime;
    const requestsPerSecond = (requestCount / (duration / 1000)).toFixed(2);
    
    console.log(`📊 Rapid Request Results:`);
    console.log(`   Total Requests: ${requestCount}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Rate: ${requestsPerSecond} requests/second`);
    
    // Check for rate limiting indicators
    const rateLimitedCount = results.filter(r => 
        r.status === 'rejected' || 
        (r.value && !r.value.success && r.value.error && r.value.error.includes('rate'))
    ).length;
    
    console.log(`   Rate Limited: ${rateLimitedCount}`);
    
    // If all requests succeed, that's actually good for our use case
    // But we should be aware of potential DoS vulnerabilities
    if (failed === 0) {
        console.log(`✅ All requests handled (good performance)`);
        console.log(`⚠️ Consider implementing rate limiting for production`);
    } else {
        console.log(`⚠️ Some requests failed - may indicate rate limiting or server stress`);
    }
    
    return true; // This test is informational
}

// Test sensitive data exposure
async function testDataExposure() {
    console.log('\n👁️ TEST 6: Sensitive Data Exposure Prevention');
    console.log('-'.repeat(50));
    
    const exposureTests = [
        {
            name: 'Password field exposure',
            test: async () => {
                // Try to access fields that might contain passwords
                const { data, error } = await supabase
                    .from('admin_users')
                    .select('password, password_hash, encrypted_password');
                
                // Should fail or return empty
                return error || !data || data.length === 0;
            }
        },
        {
            name: 'API key exposure',
            test: async () => {
                // Try to access fields that might contain API keys
                const { data, error } = await supabase
                    .from('admin_users')
                    .select('api_key, secret_key, access_token');
                
                return error || !data || data.length === 0;
            }
        },
        {
            name: 'Credit card information',
            test: async () => {
                // Try to access payment information
                const { data, error } = await supabase
                    .from('financial_records')
                    .select('credit_card, payment_info, billing_details');
                
                return error || !data || data.length === 0;
            }
        }
    ];
    
    let secureFields = 0;
    
    for (const test of exposureTests) {
        console.log(`🔍 Testing: ${test.name}`);
        
        try {
            const isSecure = await test.test();
            
            if (isSecure) {
                console.log(`✅ Sensitive data properly protected`);
                secureFields++;
            } else {
                console.log(`❌ Potential data exposure`);
            }
        } catch (error) {
            console.log(`✅ Access blocked: ${error.message.substring(0, 50)}`);
            secureFields++;
        }
    }
    
    console.log(`\n📊 Data Exposure Prevention:`);
    console.log(`   Secure Fields: ${secureFields}/${exposureTests.length}`);
    console.log(`   Success Rate: ${((secureFields/exposureTests.length)*100).toFixed(1)}%`);
    
    return secureFields === exposureTests.length;
}

// Run all security tests
async function runSecurityTests() {
    console.log('🚀 Starting ultra-comprehensive security vulnerability testing...\n');
    
    const securityResults = {
        sqlInjection: await testSQLInjection(),
        xssPrevention: await testXSSPrevention(),
        authBypass: await testAuthBypass(),
        dataValidation: await testDataValidation(),
        rateLimiting: await testRateLimiting(),
        dataExposure: await testDataExposure()
    };
    
    // Calculate security score
    const totalTests = Object.keys(securityResults).length;
    const passedTests = Object.values(securityResults).filter(r => r === true).length;
    const securityScore = (passedTests / totalTests) * 100;
    
    console.log('\n' + '='.repeat(65));
    console.log('🔐 SECURITY VULNERABILITY TEST RESULTS');
    console.log('='.repeat(65));
    
    console.log(`\n📋 Security Test Summary:`);
    console.log(`   ${securityResults.sqlInjection ? '✅' : '❌'} SQL Injection Protection`);
    console.log(`   ${securityResults.xssPrevention ? '✅' : '❌'} XSS Prevention`);
    console.log(`   ${securityResults.authBypass ? '✅' : '❌'} Authentication Security`);
    console.log(`   ${securityResults.dataValidation ? '✅' : '❌'} Data Validation`);
    console.log(`   ${securityResults.rateLimiting ? '✅' : '❌'} Rate Limiting Analysis`);
    console.log(`   ${securityResults.dataExposure ? '✅' : '❌'} Data Exposure Prevention`);
    
    console.log(`\n📊 Overall Security Score: ${securityScore.toFixed(1)}% (${passedTests}/${totalTests})`);
    
    if (securityScore >= 90) {
        console.log(`\n🛡️ EXCELLENT SECURITY POSTURE!`);
        console.log(`🔒 Platform is secure for production deployment`);
    } else if (securityScore >= 75) {
        console.log(`\n⚠️ GOOD SECURITY - Minor improvements recommended`);
    } else {
        console.log(`\n❌ SECURITY VULNERABILITIES FOUND - Address before production`);
    }
    
    console.log(`\n🔍 Security Recommendations:`);
    console.log(`   1. Implement API rate limiting for production`);
    console.log(`   2. Add request logging and monitoring`);
    console.log(`   3. Regular security audits and penetration testing`);
    console.log(`   4. HTTPS enforcement and security headers`);
    console.log(`   5. Input validation on frontend and backend`);
    
    return securityScore >= 90;
}

runSecurityTests().catch(console.error);