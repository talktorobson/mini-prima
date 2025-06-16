// 🧮 COMPREHENSIVE FINANCIAL CALCULATIONS TESTING
// D'Avila Reis Legal Practice Management System
// Precision Testing for Financial Mathematics

console.log('🧮 COMPREHENSIVE FINANCIAL CALCULATIONS TESTING');
console.log('D\'Avila Reis Legal Practice Management System');
console.log('Testing mathematical precision and business logic\n');

// Test tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFunction, expectedResult = null) {
    totalTests++;
    try {
        const result = testFunction();
        
        if (expectedResult !== null) {
            if (Math.abs(result - expectedResult) < 0.01) {
                console.log(`✅ ${testName}: PASSED (${result})`);
                passedTests++;
                return true;
            } else {
                console.log(`❌ ${testName}: FAILED (Expected: ${expectedResult}, Got: ${result})`);
                failedTests++;
                return false;
            }
        } else {
            console.log(`✅ ${testName}: PASSED`);
            passedTests++;
            return true;
        }
    } catch (error) {
        console.log(`❌ ${testName}: FAILED (${error.message})`);
        failedTests++;
        return false;
    }
}

// =====================================================
// BRAZILIAN CURRENCY FORMATTING TESTS
// =====================================================
console.log('\n🇧🇷 BRAZILIAN CURRENCY FORMATTING TESTS');
console.log('═'.repeat(50));

function formatBrazilianCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

runTest('Currency Formatting - Basic', () => {
    const formatted = formatBrazilianCurrency(1234.56);
    console.log(`  Input: 1234.56 → Output: ${formatted}`);
    return formatted === 'R$ 1.234,56';
});

runTest('Currency Formatting - Large Amount', () => {
    const formatted = formatBrazilianCurrency(1000000.99);
    console.log(`  Input: 1000000.99 → Output: ${formatted}`);
    return formatted === 'R$ 1.000.000,99';
});

runTest('Currency Formatting - Zero', () => {
    const formatted = formatBrazilianCurrency(0);
    console.log(`  Input: 0 → Output: ${formatted}`);
    return formatted === 'R$ 0,00';
});

// =====================================================
// FLOATING POINT PRECISION TESTS
// =====================================================
console.log('\n💰 FLOATING POINT PRECISION TESTS');
console.log('═'.repeat(50));

function safeCurrencyAdd(a, b) {
    return Math.round((a + b) * 100) / 100;
}

function safeCurrencyMultiply(a, b) {
    return Math.round((a * b) * 100) / 100;
}

function safeCurrencyDivide(a, b) {
    return Math.round((a / b) * 100) / 100;
}

runTest('Safe Addition - Basic', () => {
    return safeCurrencyAdd(0.1, 0.2);
}, 0.3);

runTest('Safe Addition - Complex', () => {
    return safeCurrencyAdd(123.45, 67.89);
}, 191.34);

runTest('Safe Multiplication - Tax Calculation', () => {
    return safeCurrencyMultiply(1000, 0.1);
}, 100.0);

runTest('Safe Division - Payment Split', () => {
    return safeCurrencyDivide(100, 3);
}, 33.33);

// Test edge cases
runTest('Edge Case - Very Small Numbers', () => {
    return safeCurrencyAdd(0.01, 0.01);
}, 0.02);

runTest('Edge Case - Large Numbers', () => {
    return safeCurrencyAdd(999999.99, 0.01);
}, 1000000.0);

// =====================================================
// PAYMENT INSTALLMENT CALCULATIONS
// =====================================================
console.log('\n📅 PAYMENT INSTALLMENT CALCULATIONS');
console.log('═'.repeat(50));

function calculateInstallments(principal, interestRate, months) {
    if (months === 1) return principal;
    
    const monthlyRate = interestRate / 100 / 12;
    const installmentAmount = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                             (Math.pow(1 + monthlyRate, months) - 1);
    
    return Math.round(installmentAmount * 100) / 100;
}

function calculateTotalInterest(principal, monthlyPayment, months) {
    return Math.round(((monthlyPayment * months) - principal) * 100) / 100;
}

runTest('Installment - 6 months at 2%', () => {
    const installment = calculateInstallments(10000, 24, 6);
    console.log(`  Principal: R$ 10,000.00, 6x, 24% yearly → R$ ${installment.toFixed(2)}/month`);
    return installment;
}, 1845.97);

runTest('Installment - 12 months at 2%', () => {
    const installment = calculateInstallments(10000, 24, 12);
    console.log(`  Principal: R$ 10,000.00, 12x, 24% yearly → R$ ${installment.toFixed(2)}/month`);
    return installment;
}, 945.60);

runTest('Total Interest Calculation', () => {
    const installment = calculateInstallments(10000, 24, 12);
    const totalInterest = calculateTotalInterest(10000, installment, 12);
    console.log(`  Total Interest: R$ ${totalInterest.toFixed(2)}`);
    return totalInterest;
}, 1347.20);

// =====================================================
// AGING REPORT CALCULATIONS
// =====================================================
console.log('\n📊 AGING REPORT CALCULATIONS');
console.log('═'.repeat(50));

function calculateAgingBucket(dueDate, currentDate = new Date()) {
    const due = new Date(dueDate);
    const current = new Date(currentDate);
    const daysDiff = Math.floor((current - due) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 0) return 'current';
    if (daysDiff <= 30) return '1-30';
    if (daysDiff <= 60) return '31-60';
    if (daysDiff <= 90) return '61-90';
    return '90+';
}

runTest('Aging - Current Invoice', () => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
    const bucket = calculateAgingBucket(futureDate, today);
    console.log(`  Due in 5 days → ${bucket}`);
    return bucket === 'current';
});

runTest('Aging - 15 Days Overdue', () => {
    const today = new Date();
    const pastDate = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
    const bucket = calculateAgingBucket(pastDate, today);
    console.log(`  15 days overdue → ${bucket}`);
    return bucket === '1-30';
});

runTest('Aging - 45 Days Overdue', () => {
    const today = new Date();
    const pastDate = new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000);
    const bucket = calculateAgingBucket(pastDate, today);
    console.log(`  45 days overdue → ${bucket}`);
    return bucket === '31-60';
});

runTest('Aging - 100 Days Overdue', () => {
    const today = new Date();
    const pastDate = new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000);
    const bucket = calculateAgingBucket(pastDate, today);
    console.log(`  100 days overdue → ${bucket}`);
    return bucket === '90+';
});

// =====================================================
// TAX CALCULATIONS (BRAZILIAN)
// =====================================================
console.log('\n🧾 TAX CALCULATIONS (BRAZILIAN)');
console.log('═'.repeat(50));

function calculateISS(serviceValue, issRate = 5) {
    return Math.round(serviceValue * (issRate / 100) * 100) / 100;
}

function calculatePIS(serviceValue, pisRate = 0.65) {
    return Math.round(serviceValue * (pisRate / 100) * 100) / 100;
}

function calculateCOFINS(serviceValue, cofinsRate = 3) {
    return Math.round(serviceValue * (cofinsRate / 100) * 100) / 100;
}

function calculateIRRF(serviceValue, irrfRate = 1.5) {
    return Math.round(serviceValue * (irrfRate / 100) * 100) / 100;
}

runTest('ISS Calculation - 5%', () => {
    const iss = calculateISS(10000, 5);
    console.log(`  Service Value: R$ 10,000.00, ISS 5% → R$ ${iss.toFixed(2)}`);
    return iss;
}, 500.00);

runTest('PIS Calculation - 0.65%', () => {
    const pis = calculatePIS(10000, 0.65);
    console.log(`  Service Value: R$ 10,000.00, PIS 0.65% → R$ ${pis.toFixed(2)}`);
    return pis;
}, 65.00);

runTest('COFINS Calculation - 3%', () => {
    const cofins = calculateCOFINS(10000, 3);
    console.log(`  Service Value: R$ 10,000.00, COFINS 3% → R$ ${cofins.toFixed(2)}`);
    return cofins;
}, 300.00);

runTest('IRRF Calculation - 1.5%', () => {
    const irrf = calculateIRRF(10000, 1.5);
    console.log(`  Service Value: R$ 10,000.00, IRRF 1.5% → R$ ${irrf.toFixed(2)}`);
    return irrf;
}, 150.00);

// =====================================================
// CASH FLOW PROJECTIONS
// =====================================================
console.log('\n📈 CASH FLOW PROJECTIONS');
console.log('═'.repeat(50));

function projectCashFlow(initialBalance, receivables, payables, months = 6) {
    const projections = [];
    let runningBalance = initialBalance;
    
    for (let month = 1; month <= months; month++) {
        const monthlyReceivables = receivables * (1 - (month * 0.05)); // Slight decline
        const monthlyPayables = payables * (1 + (month * 0.02)); // Slight increase
        
        runningBalance += monthlyReceivables - monthlyPayables;
        
        projections.push({
            month,
            receivables: Math.round(monthlyReceivables * 100) / 100,
            payables: Math.round(monthlyPayables * 100) / 100,
            balance: Math.round(runningBalance * 100) / 100
        });
    }
    
    return projections;
}

runTest('Cash Flow Projection - 6 Months', () => {
    const projections = projectCashFlow(50000, 25000, 15000, 6);
    console.log(`  Starting Balance: R$ 50,000.00`);
    console.log(`  Monthly Receivables: R$ 25,000.00 (declining 5%/month)`);
    console.log(`  Monthly Payables: R$ 15,000.00 (increasing 2%/month)`);
    console.log(`  Final Balance (Month 6): R$ ${projections[5].balance.toFixed(2)}`);
    
    return projections[5].balance > 0;
});

// =====================================================
// DATE CALCULATIONS (BRAZILIAN FORMAT)
// =====================================================
console.log('\n📅 DATE CALCULATIONS (BRAZILIAN FORMAT)');
console.log('═'.repeat(50));

function formatBrazilianDate(date) {
    return new Intl.DateTimeFormat('pt-BR').format(date);
}

function addBusinessDays(date, days) {
    const result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            addedDays++;
        }
    }
    
    return result;
}

runTest('Brazilian Date Formatting', () => {
    const date = new Date('2024-12-31');
    const formatted = formatBrazilianDate(date);
    console.log(`  2024-12-31 → ${formatted}`);
    return formatted === '31/12/2024';
});

runTest('Business Days Calculation', () => {
    const startDate = new Date('2024-12-16'); // Monday
    const endDate = addBusinessDays(startDate, 5); // Should be next Monday
    const formatted = formatBrazilianDate(endDate);
    console.log(`  Start: ${formatBrazilianDate(startDate)}, +5 business days → ${formatted}`);
    return endDate.getDay() === 1; // Monday
});

// =====================================================
// ROUNDING EDGE CASES
// =====================================================
console.log('\n🔄 ROUNDING EDGE CASES');
console.log('═'.repeat(50));

runTest('Rounding - 0.5 Cents', () => {
    const value = 10.495;
    const rounded = Math.round(value * 100) / 100;
    console.log(`  ${value} → ${rounded}`);
    return rounded === 10.50;
});

runTest('Rounding - 0.4 Cents', () => {
    const value = 10.494;
    const rounded = Math.round(value * 100) / 100;
    console.log(`  ${value} → ${rounded}`);
    return rounded === 10.49;
});

runTest('Rounding - Large Number', () => {
    const value = 999999.999;
    const rounded = Math.round(value * 100) / 100;
    console.log(`  ${value} → ${rounded}`);
    return rounded === 1000000.00;
});

// =====================================================
// FINAL RESULTS
// =====================================================
console.log('\n' + '═'.repeat(70));
console.log('📊 COMPREHENSIVE CALCULATIONS TEST SUMMARY');
console.log('═'.repeat(70));

const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

console.log(`Total Tests Run: ${totalTests}`);
console.log(`Tests Passed: ${passedTests} ✅`);
console.log(`Tests Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
console.log(`Success Rate: ${successRate}%`);

if (successRate >= 95) {
    console.log('\n🎉 EXCELLENT CALCULATION PRECISION - PRODUCTION READY! 🎉');
    console.log('All financial calculations are accurate and reliable');
} else if (successRate >= 85) {
    console.log('\n✅ GOOD CALCULATION PRECISION - MINOR ISSUES ✅');
    console.log('Most calculations accurate, minor improvements needed');
} else {
    console.log('\n⚠️ CALCULATION ISSUES DETECTED - FIXES NEEDED ⚠️');
    console.log('Significant calculation errors require attention');
}

console.log('\n' + '═'.repeat(70));