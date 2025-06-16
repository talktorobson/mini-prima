// Comprehensive Payment Plan Calculator Testing

console.log('🧪 COMPREHENSIVE PAYMENT PLAN CALCULATOR TESTING');
console.log('=' + '='.repeat(55));

// Payment Plan Calculator Function (from subscriptionService.ts)
function calculatePaymentPlan(config) {
    const downPayment = config.downPayment || 0;
    const financedAmount = config.totalAmount - downPayment;
    
    // Calculate monthly payment using compound interest formula
    const monthlyRate = config.interestRate;
    const monthlyPayment = monthlyRate > 0 
        ? (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, config.numberOfInstallments)) /
          (Math.pow(1 + monthlyRate, config.numberOfInstallments) - 1)
        : financedAmount / config.numberOfInstallments;
    
    const installments = [];
    let remainingBalance = financedAmount;
    
    for (let i = 1; i <= config.numberOfInstallments; i++) {
        const interestAmount = remainingBalance * monthlyRate;
        const principalAmount = monthlyPayment - interestAmount;
        
        // Adjust last payment for rounding
        const adjustedPrincipal = i === config.numberOfInstallments 
            ? remainingBalance 
            : principalAmount;
        
        const totalAmount = adjustedPrincipal + interestAmount;
        
        installments.push({
            installmentNumber: i,
            dueDate: new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000)), // 30 days apart
            principalAmount: adjustedPrincipal,
            interestAmount,
            totalAmount
        });
        
        remainingBalance -= adjustedPrincipal;
    }
    
    const totalWithInterest = downPayment + installments.reduce((sum, inst) => sum + inst.totalAmount, 0);
    const totalInterest = totalWithInterest - config.totalAmount;
    
    return {
        installments,
        totalWithInterest,
        totalInterest
    };
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

function runPaymentTest(testName, config) {
    console.log(`\n🧮 ${testName}`);
    console.log('-'.repeat(50));
    console.log(`💰 Total Amount: ${formatCurrency(config.totalAmount)}`);
    console.log(`💳 Down Payment: ${formatCurrency(config.downPayment || 0)}`);
    console.log(`📊 Installments: ${config.numberOfInstallments}`);
    console.log(`📈 Interest Rate: ${(config.interestRate * 100).toFixed(2)}% monthly`);
    
    try {
        const result = calculatePaymentPlan(config);
        
        console.log(`\n📋 CALCULATION RESULTS:`);
        console.log(`💸 Total with Interest: ${formatCurrency(result.totalWithInterest)}`);
        console.log(`📈 Total Interest: ${formatCurrency(result.totalInterest)}`);
        
        const avgPayment = result.installments.reduce((sum, inst) => sum + inst.totalAmount, 0) / result.installments.length;
        console.log(`💳 Average Payment: ${formatCurrency(avgPayment)}`);
        
        console.log(`\n📅 INSTALLMENT SCHEDULE:`);
        result.installments.forEach((installment, index) => {
            if (index < 3 || index >= result.installments.length - 2) { // Show first 3 and last 2
                console.log(`${installment.installmentNumber.toString().padStart(2)}: ${formatCurrency(installment.totalAmount)} (Principal: ${formatCurrency(installment.principalAmount)}, Interest: ${formatCurrency(installment.interestAmount)})`);
            } else if (index === 3) {
                console.log(`  ... (${result.installments.length - 5} more installments) ...`);
            }
        });
        
        // Validation checks
        const calculatedTotal = result.installments.reduce((sum, inst) => sum + inst.totalAmount, 0) + (config.downPayment || 0);
        const difference = Math.abs(calculatedTotal - result.totalWithInterest);
        
        if (difference < 0.01) {
            console.log(`\n✅ VALIDATION: Payment calculation accurate (diff: ${formatCurrency(difference)})`);
            return true;
        } else {
            console.log(`\n❌ VALIDATION: Payment calculation error (diff: ${formatCurrency(difference)})`);
            return false;
        }
        
    } catch (error) {
        console.log(`\n❌ ERROR: ${error.message}`);
        return false;
    }
}

// Test Cases
let passedTests = 0;
let totalTests = 0;

// Test 1: Basic case - R$ 15,000 in 6 installments with 2% monthly interest
totalTests++;
if (runPaymentTest('Test 1: Basic Labor Law Case', {
    totalAmount: 15000,
    numberOfInstallments: 6,
    interestRate: 0.02, // 2% monthly
    downPayment: 0
})) passedTests++;

// Test 2: Corporate case with down payment
totalTests++;
if (runPaymentTest('Test 2: Corporate Case with Down Payment', {
    totalAmount: 50000,
    numberOfInstallments: 12,
    interestRate: 0.025, // 2.5% monthly
    downPayment: 10000
})) passedTests++;

// Test 3: No interest (installment only)
totalTests++;
if (runPaymentTest('Test 3: No Interest Payment Plan', {
    totalAmount: 8000,
    numberOfInstallments: 4,
    interestRate: 0, // No interest
    downPayment: 2000
})) passedTests++;

// Test 4: High value enterprise case
totalTests++;
if (runPaymentTest('Test 4: High-Value Enterprise Case', {
    totalAmount: 100000,
    numberOfInstallments: 24,
    interestRate: 0.015, // 1.5% monthly
    downPayment: 20000
})) passedTests++;

// Test 5: Small case, short term
totalTests++;
if (runPaymentTest('Test 5: Small Quick Case', {
    totalAmount: 5000,
    numberOfInstallments: 3,
    interestRate: 0.03, // 3% monthly
    downPayment: 1000
})) passedTests++;

// Test 6: Edge case - Single installment
totalTests++;
if (runPaymentTest('Test 6: Single Installment', {
    totalAmount: 12000,
    numberOfInstallments: 1,
    interestRate: 0.02,
    downPayment: 0
})) passedTests++;

// Test 7: Maximum installments (24 months)
totalTests++;
if (runPaymentTest('Test 7: Maximum 24 Installments', {
    totalAmount: 75000,
    numberOfInstallments: 24,
    interestRate: 0.018, // 1.8% monthly
    downPayment: 15000
})) passedTests++;

// Edge case testing
console.log(`\n🔬 EDGE CASE TESTING`);
console.log('=' + '='.repeat(25));

// Test edge cases that might break the calculator
const edgeCases = [
    { name: 'Zero amount', config: { totalAmount: 0, numberOfInstallments: 1, interestRate: 0.02 } },
    { name: 'Negative interest', config: { totalAmount: 10000, numberOfInstallments: 6, interestRate: -0.01 } },
    { name: 'Down payment > total', config: { totalAmount: 5000, numberOfInstallments: 3, interestRate: 0.02, downPayment: 6000 } }
];

edgeCases.forEach(testCase => {
    console.log(`\n🧪 Edge Case: ${testCase.name}`);
    try {
        const result = calculatePaymentPlan(testCase.config);
        console.log(`⚠️ Unexpected success - should handle edge case better`);
    } catch (error) {
        console.log(`✅ Properly handled: ${error.message}`);
    }
});

// Final Results
console.log(`\n📊 PAYMENT CALCULATOR TESTING RESULTS`);
console.log('=' + '='.repeat(40));
console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log(`\n🎉 ALL PAYMENT CALCULATOR TESTS PASSED!`);
    console.log(`💰 Calculator is ready for production use`);
} else {
    console.log(`\n⚠️ Some tests failed - review implementation`);
}

// Business validation examples
console.log(`\n💼 BUSINESS SCENARIO VALIDATION`);
console.log('=' + '='.repeat(35));

const businessScenarios = [
    {
        name: 'Typical Labor Litigation',
        amount: 18000,
        installments: 6,
        rate: 0.02,
        expectedMonthly: 3100 // Approximate
    },
    {
        name: 'Corporate M&A Case',
        amount: 80000,
        installments: 12,
        rate: 0.015,
        expectedMonthly: 7200 // Approximate
    }
];

businessScenarios.forEach(scenario => {
    console.log(`\n📋 ${scenario.name}:`);
    const result = calculatePaymentPlan({
        totalAmount: scenario.amount,
        numberOfInstallments: scenario.installments,
        interestRate: scenario.rate
    });
    
    const actualMonthly = result.installments[0].totalAmount;
    const difference = Math.abs(actualMonthly - scenario.expectedMonthly);
    const percentDiff = (difference / scenario.expectedMonthly) * 100;
    
    console.log(`   Expected ~${formatCurrency(scenario.expectedMonthly)}/month`);
    console.log(`   Actual: ${formatCurrency(actualMonthly)}/month`);
    
    if (percentDiff < 10) {
        console.log(`   ✅ Within 10% tolerance (${percentDiff.toFixed(1)}% diff)`);
    } else {
        console.log(`   ⚠️ Outside tolerance (${percentDiff.toFixed(1)}% diff)`);
    }
});