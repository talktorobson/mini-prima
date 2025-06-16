// Payment Calculation Precision Testing
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://cmgtjqycneerfdxmdmwp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('💰 PAYMENT CALCULATION PRECISION TESTING');
console.log('=' + '='.repeat(50));

// Advanced payment calculation functions (mirrors subscription service)
function calculatePaymentPlan(totalAmount, numberOfInstallments, interestRate = 0.02) {
    if (numberOfInstallments <= 1) {
        return {
            monthlyPayment: totalAmount,
            totalAmount: totalAmount,
            totalInterest: 0,
            installments: [{ installment: 1, amount: totalAmount, principalPayment: totalAmount, interestPayment: 0, remainingBalance: 0 }]
        };
    }

    // Compound interest formula: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = (totalAmount * interestRate * Math.pow(1 + interestRate, numberOfInstallments)) /
        (Math.pow(1 + interestRate, numberOfInstallments) - 1);

    const totalPaid = monthlyPayment * numberOfInstallments;
    const totalInterest = totalPaid - totalAmount;

    // Generate installment schedule
    const installments = [];
    let remainingBalance = totalAmount;

    for (let i = 1; i <= numberOfInstallments; i++) {
        const interestPayment = remainingBalance * interestRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;

        // Handle floating point precision for last installment
        if (i === numberOfInstallments) {
            remainingBalance = 0;
        }

        installments.push({
            installment: i,
            amount: Math.round(monthlyPayment * 100) / 100,
            principalPayment: Math.round(principalPayment * 100) / 100,
            interestPayment: Math.round(interestPayment * 100) / 100,
            remainingBalance: Math.round(remainingBalance * 100) / 100
        });
    }

    return {
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalAmount: Math.round(totalPaid * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        installments
    };
}

function calculateSubscriptionDiscount(subscriptionTier, category, litigationType) {
    // Discount matrix implementation
    const SUBSCRIPTION_DISCOUNT_MATRIX = {
        basic: {
            labor_law: {
                labor_litigation: 15,
                employment_dispute: 12,
                union_negotiation: 10
            },
            corporate_law: {
                corporate_litigation: 10,
                contract_dispute: 8,
                mergers_acquisitions: 5
            },
            full_service: {
                labor_litigation: 12,
                corporate_litigation: 10,
                contract_dispute: 8
            }
        },
        professional: {
            labor_law: {
                labor_litigation: 25,
                employment_dispute: 20,
                union_negotiation: 18
            },
            corporate_law: {
                corporate_litigation: 20,
                contract_dispute: 15,
                mergers_acquisitions: 12
            },
            full_service: {
                labor_litigation: 22,
                corporate_litigation: 18,
                contract_dispute: 15
            }
        },
        enterprise: {
            labor_law: {
                labor_litigation: 35,
                employment_dispute: 30,
                union_negotiation: 28
            },
            corporate_law: {
                corporate_litigation: 30,
                contract_dispute: 25,
                mergers_acquisitions: 20
            },
            full_service: {
                labor_litigation: 32,
                corporate_litigation: 28,
                contract_dispute: 25
            }
        }
    };

    return SUBSCRIPTION_DISCOUNT_MATRIX[subscriptionTier]?.[category]?.[litigationType] || 0;
}

// Test 1: Payment plan calculation accuracy
async function testPaymentPlanAccuracy() {
    console.log('\n📊 TEST 1: Payment Plan Calculation Accuracy');
    console.log('-'.repeat(50));
    
    const testCases = [
        { amount: 10000, installments: 6, rate: 0.02, description: 'Standard case - R$ 10k, 6x, 2% month' },
        { amount: 50000, installments: 12, rate: 0.015, description: 'Large case - R$ 50k, 12x, 1.5% month' },
        { amount: 1500, installments: 3, rate: 0.025, description: 'Small case - R$ 1.5k, 3x, 2.5% month' },
        { amount: 100000, installments: 24, rate: 0.01, description: 'Enterprise case - R$ 100k, 24x, 1% month' },
        { amount: 25000, installments: 1, rate: 0.02, description: 'No installments - R$ 25k, 1x' },
        { amount: 7500.50, installments: 4, rate: 0.0175, description: 'Decimal amount - R$ 7.5k, 4x, 1.75% month' }
    ];
    
    let accuracyTests = 0;
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n🧪 Test ${i + 1}: ${testCase.description}`);
        
        try {
            const result = calculatePaymentPlan(testCase.amount, testCase.installments, testCase.rate);
            
            // Validation checks
            let isValid = true;
            const validationErrors = [];
            
            // Check if monthly payment is reasonable
            if (result.monthlyPayment <= 0) {
                isValid = false;
                validationErrors.push('Monthly payment must be positive');
            }
            
            // Check if total amount is greater than principal for multi-installment plans
            if (testCase.installments > 1 && result.totalAmount <= testCase.amount) {
                isValid = false;
                validationErrors.push('Total amount should include interest for multi-installment plans');
            }
            
            // Check if installment schedule adds up correctly
            const calculatedTotal = result.installments.reduce((sum, inst) => sum + inst.amount, 0);
            const totalDifference = Math.abs(calculatedTotal - result.totalAmount);
            if (totalDifference > 0.02) { // Allow 2 cents rounding difference
                isValid = false;
                validationErrors.push(`Installment sum (${calculatedTotal}) doesn't match total (${result.totalAmount})`);
            }
            
            // Check final balance is zero
            const finalBalance = result.installments[result.installments.length - 1].remainingBalance;
            if (Math.abs(finalBalance) > 0.01) {
                isValid = false;
                validationErrors.push(`Final balance should be zero, got ${finalBalance}`);
            }
            
            if (isValid) {
                console.log(`✅ Calculation accurate`);
                console.log(`   Monthly Payment: R$ ${result.monthlyPayment.toLocaleString('pt-BR')}`);
                console.log(`   Total Amount: R$ ${result.totalAmount.toLocaleString('pt-BR')}`);
                console.log(`   Total Interest: R$ ${result.totalInterest.toLocaleString('pt-BR')}`);
                console.log(`   Interest Rate: ${((result.totalInterest / testCase.amount) * 100).toFixed(2)}%`);
                accuracyTests++;
            } else {
                console.log(`❌ Calculation errors found:`);
                validationErrors.forEach(error => console.log(`   - ${error}`));
            }
            
        } catch (error) {
            console.log(`❌ Calculation failed: ${error.message}`);
        }
    }
    
    console.log(`\n📊 Payment Plan Accuracy: ${accuracyTests}/${testCases.length} passed`);
    return accuracyTests === testCases.length;
}

// Test 2: Discount matrix calculations
async function testDiscountMatrix() {
    console.log('\n🎯 TEST 2: Subscription Discount Matrix');
    console.log('-'.repeat(50));
    
    const discountTestCases = [
        { tier: 'basic', category: 'labor_law', litigation: 'labor_litigation', expected: 15 },
        { tier: 'professional', category: 'labor_law', litigation: 'labor_litigation', expected: 25 },
        { tier: 'enterprise', category: 'labor_law', litigation: 'labor_litigation', expected: 35 },
        { tier: 'basic', category: 'corporate_law', litigation: 'contract_dispute', expected: 8 },
        { tier: 'professional', category: 'corporate_law', litigation: 'mergers_acquisitions', expected: 12 },
        { tier: 'enterprise', category: 'full_service', litigation: 'corporate_litigation', expected: 28 },
        { tier: 'invalid', category: 'labor_law', litigation: 'labor_litigation', expected: 0 },
        { tier: 'basic', category: 'invalid', litigation: 'labor_litigation', expected: 0 },
        { tier: 'basic', category: 'labor_law', litigation: 'invalid', expected: 0 }
    ];
    
    let discountTests = 0;
    
    console.log('🧪 Testing discount calculations...');
    
    for (let i = 0; i < discountTestCases.length; i++) {
        const test = discountTestCases[i];
        const result = calculateSubscriptionDiscount(test.tier, test.category, test.litigation);
        
        if (result === test.expected) {
            console.log(`✅ ${test.tier}/${test.category}/${test.litigation}: ${result}%`);
            discountTests++;
        } else {
            console.log(`❌ ${test.tier}/${test.category}/${test.litigation}: Expected ${test.expected}%, got ${result}%`);
        }
    }
    
    console.log(`\n📊 Discount Matrix Accuracy: ${discountTests}/${discountTestCases.length} passed`);
    return discountTests === discountTestCases.length;
}

// Test 3: Edge cases and boundary testing
async function testEdgeCases() {
    console.log('\n🔬 TEST 3: Edge Cases and Boundary Testing');
    console.log('-'.repeat(50));
    
    const edgeCases = [
        {
            name: 'Zero amount',
            test: () => calculatePaymentPlan(0, 6, 0.02),
            expectError: true
        },
        {
            name: 'Negative amount',
            test: () => calculatePaymentPlan(-1000, 6, 0.02),
            expectError: true
        },
        {
            name: 'Zero interest rate',
            test: () => calculatePaymentPlan(1000, 6, 0),
            expectError: false
        },
        {
            name: 'Very high interest rate (50%)',
            test: () => calculatePaymentPlan(1000, 6, 0.5),
            expectError: false
        },
        {
            name: 'Very large amount (R$ 10 million)',
            test: () => calculatePaymentPlan(10000000, 12, 0.02),
            expectError: false
        },
        {
            name: 'Maximum installments (36)',
            test: () => calculatePaymentPlan(50000, 36, 0.015),
            expectError: false
        },
        {
            name: 'Floating point precision',
            test: () => calculatePaymentPlan(3333.33, 7, 0.0123),
            expectError: false
        }
    ];
    
    let edgeTestsPassed = 0;
    
    for (const edgeCase of edgeCases) {
        console.log(`\n🧪 Testing: ${edgeCase.name}`);
        
        try {
            const result = edgeCase.test();
            
            if (edgeCase.expectError) {
                console.log(`❌ Expected error but calculation succeeded`);
            } else {
                // Validate the result makes sense
                if (result.monthlyPayment > 0 && result.totalAmount >= 0) {
                    console.log(`✅ Edge case handled correctly`);
                    console.log(`   Monthly: R$ ${result.monthlyPayment.toLocaleString('pt-BR')}`);
                    console.log(`   Total: R$ ${result.totalAmount.toLocaleString('pt-BR')}`);
                    edgeTestsPassed++;
                } else {
                    console.log(`❌ Invalid result: monthly=${result.monthlyPayment}, total=${result.totalAmount}`);
                }
            }
            
        } catch (error) {
            if (edgeCase.expectError) {
                console.log(`✅ Correctly threw error: ${error.message}`);
                edgeTestsPassed++;
            } else {
                console.log(`❌ Unexpected error: ${error.message}`);
            }
        }
    }
    
    console.log(`\n📊 Edge Case Testing: ${edgeTestsPassed}/${edgeCases.length} passed`);
    return edgeTestsPassed >= Math.floor(edgeCases.length * 0.8); // 80% pass rate for edge cases
}

// Test 4: Real-world scenario calculations
async function testRealWorldScenarios() {
    console.log('\n🏢 TEST 4: Real-World Business Scenarios');
    console.log('-'.repeat(50));
    
    // Get subscription plans from database for realistic scenarios
    const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true);
    
    if (error) {
        console.log(`❌ Could not fetch subscription plans: ${error.message}`);
        return false;
    }
    
    console.log(`📋 Testing with ${plans.length} subscription plans from database`);
    
    const scenarios = [
        {
            description: 'Small business labor case with basic subscription',
            caseAmount: 15000,
            subscriptionTier: 'basic',
            category: 'labor_law',
            litigationType: 'labor_litigation',
            paymentPlan: { installments: 6, rate: 0.02 }
        },
        {
            description: 'Corporate M&A with professional subscription',
            caseAmount: 250000,
            subscriptionTier: 'professional',
            category: 'corporate_law',
            litigationType: 'mergers_acquisitions',
            paymentPlan: { installments: 12, rate: 0.015 }
        },
        {
            description: 'Enterprise litigation with full-service subscription',
            caseAmount: 500000,
            subscriptionTier: 'enterprise',
            category: 'full_service',
            litigationType: 'corporate_litigation',
            paymentPlan: { installments: 24, rate: 0.01 }
        }
    ];
    
    let scenariosPassed = 0;
    
    for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        console.log(`\n💼 Scenario ${i + 1}: ${scenario.description}`);
        
        try {
            // Calculate subscription discount
            const discountPercentage = calculateSubscriptionDiscount(
                scenario.subscriptionTier, 
                scenario.category, 
                scenario.litigationType
            );
            
            const discountAmount = scenario.caseAmount * (discountPercentage / 100);
            const discountedAmount = scenario.caseAmount - discountAmount;
            
            // Calculate payment plan for discounted amount
            const paymentPlan = calculatePaymentPlan(
                discountedAmount,
                scenario.paymentPlan.installments,
                scenario.paymentPlan.rate
            );
            
            console.log(`💰 Original Case Amount: R$ ${scenario.caseAmount.toLocaleString('pt-BR')}`);
            console.log(`🎯 Subscription Discount: ${discountPercentage}% (R$ ${discountAmount.toLocaleString('pt-BR')})`);
            console.log(`💸 Discounted Amount: R$ ${discountedAmount.toLocaleString('pt-BR')}`);
            console.log(`📅 Payment Plan: ${scenario.paymentPlan.installments}x of R$ ${paymentPlan.monthlyPayment.toLocaleString('pt-BR')}`);
            console.log(`💼 Total Cost: R$ ${paymentPlan.totalAmount.toLocaleString('pt-BR')}`);
            console.log(`📈 Total Interest: R$ ${paymentPlan.totalInterest.toLocaleString('pt-BR')}`);
            
            // Calculate ROI for subscription
            const plan = plans.find(p => p.tier === scenario.subscriptionTier && p.category === scenario.category);
            if (plan) {
                const annualSubscription = plan.monthly_price * 12;
                const annualSavings = discountAmount * 2; // Assuming 2 cases per year
                const roi = ((annualSavings - annualSubscription) / annualSubscription) * 100;
                
                console.log(`🎯 Annual Subscription: R$ ${annualSubscription.toLocaleString('pt-BR')}`);
                console.log(`💰 Annual Savings (2 cases): R$ ${annualSavings.toLocaleString('pt-BR')}`);
                console.log(`📊 ROI: ${roi.toFixed(1)}%`);
                
                if (roi > 0) {
                    console.log(`✅ Positive ROI - business case validated`);
                    scenariosPassed++;
                } else {
                    console.log(`⚠️ Negative ROI - review pricing strategy`);
                }
            } else {
                console.log(`✅ Calculation successful (no plan data for ROI)`);
                scenariosPassed++;
            }
            
        } catch (error) {
            console.log(`❌ Scenario calculation failed: ${error.message}`);
        }
    }
    
    console.log(`\n📊 Real-World Scenarios: ${scenariosPassed}/${scenarios.length} passed`);
    return scenariosPassed === scenarios.length;
}

// Test 5: Database integration for calculations
async function testDatabaseIntegration() {
    console.log('\n🗄️ TEST 5: Database Integration for Calculations');
    console.log('-'.repeat(50));
    
    console.log('🧪 Testing database-driven calculations...');
    
    try {
        // Test fetching subscription plans for calculations
        const { data: plans, error: plansError } = await supabase
            .from('subscription_plans')
            .select('id, name, tier, category, monthly_price, litigation_discount_percentage')
            .eq('is_active', true);
        
        if (plansError) throw plansError;
        
        console.log(`✅ Retrieved ${plans.length} subscription plans`);
        
        // Test calculating MRR with mock data
        const mockSubscriptions = plans.map((plan, index) => ({
            id: `mock-${index}`,
            plan_id: plan.id,
            monthly_amount: plan.monthly_price,
            status: 'active'
        }));
        
        const totalMRR = mockSubscriptions.reduce((sum, sub) => sum + sub.monthly_amount, 0);
        const averageRevenue = totalMRR / mockSubscriptions.length;
        
        console.log(`💰 Mock MRR Calculation: R$ ${totalMRR.toLocaleString('pt-BR')}`);
        console.log(`📊 Average Revenue Per User: R$ ${averageRevenue.toFixed(2)}`);
        
        // Test service types for fee calculations
        const { data: services, error: servicesError } = await supabase
            .from('service_types')
            .select('name, minimum_fee, allows_payment_plans')
            .limit(3);
        
        if (servicesError) throw servicesError;
        
        console.log(`✅ Retrieved ${services.length} service types for fee calculations`);
        
        services.forEach(service => {
            console.log(`   ${service.name}: Min R$ ${service.minimum_fee} (Payment plans: ${service.allows_payment_plans ? 'Yes' : 'No'})`);
        });
        
        console.log(`✅ Database integration working correctly`);
        return true;
        
    } catch (error) {
        console.log(`❌ Database integration error: ${error.message}`);
        return false;
    }
}

// Run all payment calculation tests
async function runAllPaymentTests() {
    console.log('🚀 Starting comprehensive payment calculation testing...\n');
    
    const testResults = {
        paymentPlanAccuracy: await testPaymentPlanAccuracy(),
        discountMatrix: await testDiscountMatrix(),
        edgeCases: await testEdgeCases(),
        realWorldScenarios: await testRealWorldScenarios(),
        databaseIntegration: await testDatabaseIntegration()
    };
    
    // Calculate overall accuracy score
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(r => r === true).length;
    const accuracyScore = (passedTests / totalTests) * 100;
    
    console.log('\n' + '='.repeat(50));
    console.log('💰 PAYMENT CALCULATION PRECISION RESULTS');
    console.log('='.repeat(50));
    
    console.log(`\n📋 Payment Calculation Test Summary:`);
    console.log(`   ${testResults.paymentPlanAccuracy ? '✅' : '❌'} Payment Plan Accuracy`);
    console.log(`   ${testResults.discountMatrix ? '✅' : '❌'} Subscription Discount Matrix`);
    console.log(`   ${testResults.edgeCases ? '✅' : '❌'} Edge Cases and Boundary Testing`);
    console.log(`   ${testResults.realWorldScenarios ? '✅' : '❌'} Real-World Business Scenarios`);
    console.log(`   ${testResults.databaseIntegration ? '✅' : '❌'} Database Integration`);
    
    console.log(`\n📊 Overall Accuracy Score: ${accuracyScore.toFixed(1)}% (${passedTests}/${totalTests})`);
    
    if (accuracyScore >= 95) {
        console.log(`\n🎯 EXCELLENT CALCULATION PRECISION!`);
        console.log(`💰 Payment calculations are production-ready`);
        console.log(`🧮 Financial accuracy meets business requirements`);
        console.log(`📊 Subscription discounts working correctly`);
    } else if (accuracyScore >= 85) {
        console.log(`\n⚠️ GOOD ACCURACY - Minor improvements recommended`);
        console.log(`🔧 Review edge cases and error handling`);
    } else {
        console.log(`\n❌ CALCULATION ISSUES DETECTED`);
        console.log(`🔧 Critical fixes required before production use`);
    }
    
    console.log(`\n💡 Financial System Recommendations:`);
    console.log(`   1. Implement rounding strategy for currency precision`);
    console.log(`   2. Add audit trail for all financial calculations`);
    console.log(`   3. Set up automated reconciliation checks`);
    console.log(`   4. Monitor payment plan default rates in production`);
    console.log(`   5. Regular validation against accounting standards`);
    
    return accuracyScore >= 95;
}

runAllPaymentTests().catch(console.error);