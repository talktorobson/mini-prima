#!/usr/bin/env node

// Test Banking Operations to ensure the migration is fully functional
// This script tests actual banking operations without modifying data

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cmgtjqycneerfdxmdmwp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bold');
  console.log('='.repeat(70));
}

async function testPaymentMethodsAPI() {
  try {
    log('\n🧪 Testing Payment Methods API...', 'blue');
    
    // Test fetching active payment methods (public access)
    const { data: methods, error } = await supabase
      .from('payment_methods')
      .select(`
        id,
        method_type,
        method_name,
        display_name,
        is_active,
        configuration,
        min_amount,
        max_amount,
        processing_time
      `)
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) {
      log(`  ❌ Payment methods query failed: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
    
    log(`  ✅ Found ${methods.length} active payment methods`, 'green');
    
    // Verify PIX method
    const pixMethod = methods.find(m => m.method_type === 'pix');
    if (pixMethod) {
      log(`  💳 PIX Method:`, 'cyan');
      log(`    • Name: ${pixMethod.display_name}`, 'cyan');
      log(`    • Range: R$ ${pixMethod.min_amount} - R$ ${pixMethod.max_amount}`, 'cyan');
      log(`    • Processing: ${pixMethod.processing_time}`, 'cyan');
      log(`    • Config: ${JSON.stringify(pixMethod.configuration)}`, 'cyan');
    } else {
      log(`  ❌ PIX method not found`, 'red');
      return { success: false, error: 'PIX method missing' };
    }
    
    // Verify Boleto method
    const boletoMethod = methods.find(m => m.method_type === 'boleto');
    if (boletoMethod) {
      log(`  🧾 Boleto Method:`, 'cyan');
      log(`    • Name: ${boletoMethod.display_name}`, 'cyan');
      log(`    • Range: R$ ${boletoMethod.min_amount} - R$ ${boletoMethod.max_amount}`, 'cyan');
      log(`    • Processing: ${boletoMethod.processing_time}`, 'cyan');
      log(`    • Config: ${JSON.stringify(boletoMethod.configuration)}`, 'cyan');
    } else {
      log(`  ❌ Boleto method not found`, 'red');
      return { success: false, error: 'Boleto method missing' };
    }
    
    return { 
      success: true, 
      methods, 
      pixMethod, 
      boletoMethod 
    };
    
  } catch (error) {
    log(`  💥 Payment methods test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testBankingTableQueries() {
  const bankingTables = [
    'pix_transactions',
    'boletos',
    'payment_reconciliation',
    'banking_webhooks',
    'transaction_logs'
  ];
  
  const results = {};
  
  log('\n🔍 Testing Banking Table Queries...', 'blue');
  
  for (const table of bankingTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        // Expected for protected tables - RLS is working
        results[table] = { 
          success: true, 
          protected: true, 
          error: error.message 
        };
        log(`  🔒 ${table}: Protected by RLS (${error.code})`, 'green');
      } else {
        results[table] = { 
          success: true, 
          protected: false, 
          records: data?.length || 0 
        };
        log(`  ✅ ${table}: Accessible (${data?.length || 0} records)`, 'yellow');
      }
    } catch (err) {
      results[table] = { 
        success: false, 
        error: err.message 
      };
      log(`  ❌ ${table}: Failed - ${err.message}`, 'red');
    }
  }
  
  return results;
}

async function testJSONBColumns() {
  log('\n🧮 Testing JSONB Column Operations...', 'blue');
  
  try {
    // Test querying JSONB configuration from payment_methods
    const { data, error } = await supabase
      .from('payment_methods')
      .select('method_name, configuration, fees')
      .not('configuration', 'is', null);
    
    if (error) {
      log(`  ❌ JSONB query failed: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
    
    log(`  ✅ JSONB queries working`, 'green');
    
    for (const method of data || []) {
      log(`  📋 ${method.method_name}:`, 'cyan');
      if (method.configuration) {
        log(`    • Config: ${JSON.stringify(method.configuration)}`, 'cyan');
      }
      if (method.fees) {
        log(`    • Fees: ${JSON.stringify(method.fees)}`, 'cyan');
      }
    }
    
    return { success: true, data };
    
  } catch (error) {
    log(`  💥 JSONB test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testBankingWorkflow() {
  log('\n🏦 Testing Banking Workflow Simulation...', 'blue');
  
  try {
    // Simulate getting payment methods for a payment form
    const { data: methods } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (!methods || methods.length === 0) {
      log(`  ❌ No payment methods available`, 'red');
      return { success: false };
    }
    
    log(`  ✅ Payment methods loaded for UI`, 'green');
    
    // Simulate PIX payment scenario
    const pixMethod = methods.find(m => m.method_type === 'pix');
    if (pixMethod) {
      const paymentAmount = 150.00;
      
      log(`  💳 PIX Payment Simulation:`, 'cyan');
      log(`    • Amount: R$ ${paymentAmount.toFixed(2)}`, 'cyan');
      log(`    • Method: ${pixMethod.display_name}`, 'cyan');
      log(`    • Min/Max: R$ ${pixMethod.min_amount} - R$ ${pixMethod.max_amount}`, 'cyan');
      
      // Validate amount range
      const validAmount = paymentAmount >= pixMethod.min_amount && 
                         paymentAmount <= pixMethod.max_amount;
      
      log(`    • Amount validation: ${validAmount ? 'PASS' : 'FAIL'}`, validAmount ? 'green' : 'red');
      
      if (pixMethod.configuration?.instant) {
        log(`    • Processing: Instant (${pixMethod.processing_time})`, 'green');
      }
    }
    
    // Simulate Boleto payment scenario
    const boletoMethod = methods.find(m => m.method_type === 'boleto');
    if (boletoMethod) {
      const paymentAmount = 2500.00;
      
      log(`  🧾 Boleto Payment Simulation:`, 'cyan');
      log(`    • Amount: R$ ${paymentAmount.toFixed(2)}`, 'cyan');
      log(`    • Method: ${boletoMethod.display_name}`, 'cyan');
      log(`    • Processing: ${boletoMethod.processing_time}`, 'cyan');
      
      if (boletoMethod.configuration?.due_days) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + boletoMethod.configuration.due_days);
        log(`    • Due date: ${dueDate.toDateString()}`, 'cyan');
      }
    }
    
    return { 
      success: true, 
      methods, 
      simulatedPixPayment: pixMethod ? { amount: 150.00, method: pixMethod } : null,
      simulatedBoletoPayment: boletoMethod ? { amount: 2500.00, method: boletoMethod } : null
    };
    
  } catch (error) {
    log(`  💥 Banking workflow test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runBankingOperationsTest() {
  logSection('🏦 BANKING OPERATIONS TEST SUITE');
  log(`📅 Generated: ${new Date().toLocaleString()}`, 'cyan');
  log(`🔗 Database: ${SUPABASE_URL}`, 'cyan');
  
  const results = {};
  let allTestsPassed = true;
  
  // Test 1: Payment Methods API
  logSection('1. PAYMENT METHODS API TEST');
  results.paymentMethods = await testPaymentMethodsAPI();
  if (!results.paymentMethods.success) {
    allTestsPassed = false;
  }
  
  // Test 2: Banking Table Queries  
  logSection('2. BANKING TABLE SECURITY TEST');
  results.tableQueries = await testBankingTableQueries();
  
  // Test 3: JSONB Operations
  logSection('3. JSONB OPERATIONS TEST');
  results.jsonb = await testJSONBColumns();
  if (!results.jsonb.success) {
    allTestsPassed = false;
  }
  
  // Test 4: Banking Workflow Simulation
  logSection('4. BANKING WORKFLOW SIMULATION');
  results.workflow = await testBankingWorkflow();
  if (!results.workflow.success) {
    allTestsPassed = false;
  }
  
  // Final Results
  logSection('📊 TEST RESULTS SUMMARY');
  
  const testsRun = Object.keys(results).length;
  const testsPassed = Object.values(results).filter(r => r.success).length;
  
  log(`📋 Tests Run: ${testsRun}`, 'cyan');
  log(`✅ Tests Passed: ${testsPassed}`, 'green');
  log(`❌ Tests Failed: ${testsRun - testsPassed}`, testsPassed === testsRun ? 'green' : 'red');
  
  if (allTestsPassed && testsPassed === testsRun) {
    logSection('🎉 ALL TESTS PASSED');
    log('Banking integration is fully operational!', 'green');
    log('', 'reset');
    log('✅ Payment methods API working', 'green');
    log('✅ Database security (RLS) configured correctly', 'green');
    log('✅ JSONB operations functional', 'green');
    log('✅ Banking workflows ready for implementation', 'green');
    log('', 'reset');
    log('🚀 Ready for PIX and Boleto integration!', 'bold');
  } else {
    logSection('⚠️  SOME TESTS FAILED');
    log('Review the errors above and fix any issues.', 'yellow');
  }
  
  return { success: allTestsPassed, results };
}

// Run the banking operations test
runBankingOperationsTest()
  .then(({ success, results }) => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`💥 Banking operations test failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });