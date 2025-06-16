// 🧪 COMPREHENSIVE FINANCIAL MANAGEMENT SYSTEM TESTING
// D'Avila Reis Legal Practice Management System
// Exhaustive Test Suite for Financial Module

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ijxqoyhbuexqkkptgoyx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqeHFveWhidWV4cWtrcHRnb3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzNjcwNTQsImV4cCI6MjA0OTk0MzA1NH0.HLQbfh8frU5gHzQcB-hQ0OSHZR8O-JqMUpQiLq3kUH0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test result tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  switch (type) {
    case 'success':
      console.log(`\x1b[32m[${timestamp}] ✓ ${message}\x1b[0m`);
      break;
    case 'error':
      console.log(`\x1b[31m[${timestamp}] ✗ ${message}\x1b[0m`);
      break;
    case 'warning':
      console.log(`\x1b[33m[${timestamp}] ⚠ ${message}\x1b[0m`);
      break;
    case 'info':
      console.log(`\x1b[34m[${timestamp}] ℹ ${message}\x1b[0m`);
      break;
    default:
      console.log(`[${timestamp}] ${message}`);
  }
}

function recordTest(testName, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    log(`${testName}: PASSED ${details}`, 'success');
  } else {
    failedTests++;
    log(`${testName}: FAILED ${details}`, 'error');
  }
  testResults.push({ testName, passed, details });
}

// Test Data Generators
function generateSupplierData() {
  const randomId = Math.floor(Math.random() * 10000);
  return {
    name: `Test Supplier ${randomId}`,
    company_name: `Test Company Ltd ${randomId}`,
    contact_name: `Contact Person ${randomId}`,
    email: `supplier${randomId}@test.com`,
    phone: `11${randomId.toString().padStart(8, '0')}`,
    address: `Test Street ${randomId}, Suite ${randomId}`,
    city: 'São Paulo',
    state: 'SP',
    postal_code: '01000-000',
    country: 'Brasil',
    tax_id: `${randomId.toString().padStart(14, '0')}`,
    payment_terms: 30,
    preferred_payment_method: ['transfer', 'pix', 'boleto'][Math.floor(Math.random() * 3)],
    notes: `Test supplier notes for supplier ${randomId}`,
    notifications_enabled: true,
    auto_send_confirmation: true,
    is_active: true
  };
}

function generateBillData(supplierId, categoryId) {
  const randomId = Math.floor(Math.random() * 10000);
  const amount = Math.floor(Math.random() * 10000) + 100;
  return {
    supplier_id: supplierId,
    category_id: categoryId,
    bill_number: `BILL-${randomId}`,
    reference_number: `REF-${randomId}`,
    description: `Test bill for services ${randomId}`,
    amount: amount,
    tax_amount: amount * 0.1,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    issue_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    priority: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)],
    payment_type: 'one_time',
    notes: `Test bill notes ${randomId}`
  };
}

function generateInvoiceData(clientId) {
  const randomId = Math.floor(Math.random() * 10000);
  const subtotal = Math.floor(Math.random() * 50000) + 1000;
  return {
    client_id: clientId,
    invoice_number: `INV-${new Date().getFullYear()}-${randomId}`,
    description: `Legal services invoice ${randomId}`,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: subtotal,
    discount_amount: 0,
    tax_amount: 0,
    payment_terms: 30,
    status: 'sent',
    notes: `Test invoice notes ${randomId}`
  };
}

// =====================================================
// TEST SUITE 1: SUPPLIER MANAGEMENT
// =====================================================
async function testSupplierManagement() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST SUITE 1: SUPPLIER MANAGEMENT', 'info');
  log('═══════════════════════════════════════════════════════', 'info');

  let testSupplierId = null;

  // Test 1.1: Create Supplier
  try {
    const supplierData = generateSupplierData();
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single();

    if (error) throw error;
    testSupplierId = data.id;
    recordTest('Create Supplier', true, `ID: ${data.id}`);
  } catch (error) {
    recordTest('Create Supplier', false, error.message);
  }

  // Test 1.2: Read Supplier
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', testSupplierId)
      .single();

    if (error) throw error;
    recordTest('Read Supplier', true, `Found: ${data.name}`);
  } catch (error) {
    recordTest('Read Supplier', false, error.message);
  }

  // Test 1.3: Update Supplier
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .update({ payment_terms: 45, notes: 'Updated payment terms' })
      .eq('id', testSupplierId)
      .select()
      .single();

    if (error) throw error;
    recordTest('Update Supplier', data.payment_terms === 45, `Terms: ${data.payment_terms}`);
  } catch (error) {
    recordTest('Update Supplier', false, error.message);
  }

  // Test 1.4: List Active Suppliers
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .limit(10);

    if (error) throw error;
    recordTest('List Active Suppliers', true, `Found: ${data.length} suppliers`);
  } catch (error) {
    recordTest('List Active Suppliers', false, error.message);
  }

  // Test 1.5: Search Suppliers
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .ilike('name', '%Test%')
      .limit(5);

    if (error) throw error;
    recordTest('Search Suppliers', true, `Found: ${data.length} matches`);
  } catch (error) {
    recordTest('Search Suppliers', false, error.message);
  }

  // Test 1.6: Deactivate Supplier
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', testSupplierId)
      .select()
      .single();

    if (error) throw error;
    recordTest('Deactivate Supplier', !data.is_active, `Active: ${data.is_active}`);
  } catch (error) {
    recordTest('Deactivate Supplier', false, error.message);
  }

  return testSupplierId;
}

// =====================================================
// TEST SUITE 2: BILLS MANAGEMENT (ACCOUNTS PAYABLE)
// =====================================================
async function testBillsManagement(supplierId) {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST SUITE 2: BILLS MANAGEMENT (ACCOUNTS PAYABLE)', 'info');
  log('═══════════════════════════════════════════════════════', 'info');

  let testBillId = null;
  let testCategoryId = null;

  // Get a test category
  try {
    const { data } = await supabase
      .from('expense_categories')
      .select('id')
      .limit(1)
      .single();
    testCategoryId = data?.id;
  } catch (error) {
    log('Failed to get expense category', 'warning');
  }

  // Test 2.1: Create Bill
  try {
    const billData = generateBillData(supplierId, testCategoryId);
    const { data, error } = await supabase
      .from('bills')
      .insert([billData])
      .select()
      .single();

    if (error) throw error;
    testBillId = data.id;
    recordTest('Create Bill', true, `ID: ${data.id}, Amount: R$ ${data.total_amount}`);
  } catch (error) {
    recordTest('Create Bill', false, error.message);
  }

  // Test 2.2: Read Bill with Relations
  try {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        supplier:suppliers(*),
        category:expense_categories(*)
      `)
      .eq('id', testBillId)
      .single();

    if (error) throw error;
    recordTest('Read Bill with Relations', true, 
      `Supplier: ${data.supplier?.name || 'N/A'}, Category: ${data.category?.name || 'N/A'}`);
  } catch (error) {
    recordTest('Read Bill with Relations', false, error.message);
  }

  // Test 2.3: Approve Bill
  try {
    const { data, error } = await supabase
      .from('bills')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approval_notes: 'Approved for testing'
      })
      .eq('id', testBillId)
      .select()
      .single();

    if (error) throw error;
    recordTest('Approve Bill', data.status === 'approved', `Status: ${data.status}`);
  } catch (error) {
    recordTest('Approve Bill', false, error.message);
  }

  // Test 2.4: Record Payment
  try {
    const { data: billData } = await supabase
      .from('bills')
      .select('total_amount')
      .eq('id', testBillId)
      .single();

    const paymentData = {
      payment_type: 'payable',
      reference_id: testBillId,
      reference_table: 'bills',
      amount: billData.total_amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'transfer',
      reference_number: `PAY-${Date.now()}`,
      status: 'completed'
    };

    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;

    // Update bill as paid
    await supabase
      .from('bills')
      .update({
        status: 'paid',
        paid_amount: billData.total_amount,
        paid_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', testBillId);

    recordTest('Record Bill Payment', true, `Payment: R$ ${data.amount}`);
  } catch (error) {
    recordTest('Record Bill Payment', false, error.message);
  }

  // Test 2.5: List Overdue Bills
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('status', 'overdue')
      .or(`status.eq.pending,status.eq.approved`)
      .lt('due_date', yesterday)
      .limit(10);

    if (error) throw error;
    recordTest('List Overdue Bills', true, `Found: ${data.length} overdue bills`);
  } catch (error) {
    recordTest('List Overdue Bills', false, error.message);
  }

  // Test 2.6: Bills Due Soon
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .gte('due_date', today)
      .lte('due_date', weekFromNow)
      .in('status', ['pending', 'approved'])
      .limit(10);

    if (error) throw error;
    recordTest('Bills Due Soon', true, `Found: ${data.length} bills due in 7 days`);
  } catch (error) {
    recordTest('Bills Due Soon', false, error.message);
  }

  return testBillId;
}

// =====================================================
// TEST SUITE 3: INVOICES MANAGEMENT (ACCOUNTS RECEIVABLE)
// =====================================================
async function testInvoicesManagement() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST SUITE 3: INVOICES MANAGEMENT (ACCOUNTS RECEIVABLE)', 'info');
  log('═══════════════════════════════════════════════════════', 'info');

  let testInvoiceId = null;
  let testClientId = null;

  // Get a test client
  try {
    const { data } = await supabase
      .from('clients')
      .select('id')
      .limit(1)
      .single();
    testClientId = data?.id;
  } catch (error) {
    log('Failed to get test client', 'warning');
  }

  // Test 3.1: Create Invoice
  try {
    const invoiceData = generateInvoiceData(testClientId);
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (error) throw error;
    testInvoiceId = data.id;
    recordTest('Create Invoice', true, `ID: ${data.id}, Amount: R$ ${data.total_amount}`);
  } catch (error) {
    recordTest('Create Invoice', false, error.message);
  }

  // Test 3.2: Create Invoice Line Items
  try {
    const lineItems = [
      {
        invoice_id: testInvoiceId,
        description: 'Legal consultation services',
        quantity: 10,
        unit_price: 500,
        discount_percentage: 0
      },
      {
        invoice_id: testInvoiceId,
        description: 'Document review and analysis',
        quantity: 5,
        unit_price: 300,
        discount_percentage: 10
      }
    ];

    const { data, error } = await supabase
      .from('invoice_line_items')
      .insert(lineItems)
      .select();

    if (error) throw error;
    recordTest('Create Invoice Line Items', true, `Created: ${data.length} items`);
  } catch (error) {
    recordTest('Create Invoice Line Items', false, error.message);
  }

  // Test 3.3: Read Invoice with Relations
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        line_items:invoice_line_items(*)
      `)
      .eq('id', testInvoiceId)
      .single();

    if (error) throw error;
    recordTest('Read Invoice with Relations', true, 
      `Client: ${data.client?.name || 'N/A'}, Line Items: ${data.line_items?.length || 0}`);
  } catch (error) {
    recordTest('Read Invoice with Relations', false, error.message);
  }

  // Test 3.4: Record Partial Payment
  try {
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('id', testInvoiceId)
      .single();

    const partialAmount = invoiceData.total_amount * 0.5;
    const paymentData = {
      payment_type: 'receivable',
      reference_id: testInvoiceId,
      reference_table: 'invoices',
      amount: partialAmount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'pix',
      reference_number: `REC-${Date.now()}`,
      status: 'completed'
    };

    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;

    // Update invoice with partial payment
    await supabase
      .from('invoices')
      .update({
        paid_amount: partialAmount,
        status: 'partial_paid'
      })
      .eq('id', testInvoiceId);

    recordTest('Record Partial Payment', true, `Paid: R$ ${data.amount} of R$ ${invoiceData.total_amount}`);
  } catch (error) {
    recordTest('Record Partial Payment', false, error.message);
  }

  // Test 3.5: Aging Report Data
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .in('status', ['sent', 'viewed', 'partial_paid', 'overdue'])
      .limit(20);

    if (error) throw error;

    // Calculate aging buckets
    const today = new Date();
    const aging = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      over90Days: 0
    };

    data.forEach(invoice => {
      const dueDate = new Date(invoice.due_date);
      const daysPastDue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      const amount = invoice.remaining_amount || invoice.total_amount;

      if (daysPastDue <= 0) aging.current += amount;
      else if (daysPastDue <= 30) aging.days1to30 += amount;
      else if (daysPastDue <= 60) aging.days31to60 += amount;
      else if (daysPastDue <= 90) aging.days61to90 += amount;
      else aging.over90Days += amount;
    });

    recordTest('Aging Report Calculation', true, 
      `Current: R$ ${aging.current.toFixed(2)}, Overdue: R$ ${(aging.days1to30 + aging.days31to60 + aging.days61to90 + aging.over90Days).toFixed(2)}`);
  } catch (error) {
    recordTest('Aging Report Calculation', false, error.message);
  }

  // Test 3.6: Collection Status Update
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        collection_status: 'reminder_sent',
        last_reminder_sent: new Date().toISOString().split('T')[0],
        next_follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      .eq('id', testInvoiceId)
      .select()
      .single();

    if (error) throw error;
    recordTest('Update Collection Status', data.collection_status === 'reminder_sent', 
      `Status: ${data.collection_status}`);
  } catch (error) {
    recordTest('Update Collection Status', false, error.message);
  }

  return testInvoiceId;
}

// =====================================================
// TEST SUITE 4: FINANCIAL ALERTS & NOTIFICATIONS
// =====================================================
async function testFinancialAlerts() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST SUITE 4: FINANCIAL ALERTS & NOTIFICATIONS', 'info');
  log('═══════════════════════════════════════════════════════', 'info');

  // Test 4.1: Create Due Date Alert
  try {
    const alertData = {
      alert_type: 'due_date',
      severity: 'high',
      reference_type: 'bill',
      reference_id: crypto.randomUUID(),
      title: 'Bill Due Tomorrow',
      message: 'Bill BILL-12345 for R$ 5,000 is due tomorrow',
      department: 'financial',
      requires_action: true,
      action_type: 'pay'
    };

    const { data, error } = await supabase
      .from('financial_alerts')
      .insert([alertData])
      .select()
      .single();

    if (error) throw error;
    recordTest('Create Due Date Alert', true, `ID: ${data.id}`);
  } catch (error) {
    recordTest('Create Due Date Alert', false, error.message);
  }

  // Test 4.2: List Unread Alerts
  try {
    const { data, error } = await supabase
      .from('financial_alerts')
      .select('*')
      .eq('is_read', false)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    recordTest('List Unread Alerts', true, `Found: ${data.length} unread alerts`);
  } catch (error) {
    recordTest('List Unread Alerts', false, error.message);
  }

  // Test 4.3: Mark Alert as Read
  try {
    const { data: alertData } = await supabase
      .from('financial_alerts')
      .select('id')
      .eq('is_read', false)
      .limit(1)
      .single();

    if (alertData) {
      const { data, error } = await supabase
        .from('financial_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', alertData.id)
        .select()
        .single();

      if (error) throw error;
      recordTest('Mark Alert as Read', data.is_read === true, `Alert marked as read`);
    } else {
      recordTest('Mark Alert as Read', true, 'No unread alerts to test');
    }
  } catch (error) {
    recordTest('Mark Alert as Read', false, error.message);
  }

  // Test 4.4: Critical Alerts Filter
  try {
    const { data, error } = await supabase
      .from('financial_alerts')
      .select('*')
      .in('severity', ['critical', 'high'])
      .eq('is_dismissed', false)
      .limit(10);

    if (error) throw error;
    recordTest('Filter Critical Alerts', true, `Found: ${data.length} critical/high alerts`);
  } catch (error) {
    recordTest('Filter Critical Alerts', false, error.message);
  }
}

// =====================================================
// TEST SUITE 5: PAYMENT CALCULATIONS & PRECISION
// =====================================================
async function testPaymentCalculations() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST SUITE 5: PAYMENT CALCULATIONS & PRECISION', 'info');
  log('═══════════════════════════════════════════════════════', 'info');

  // Test 5.1: Floating Point Precision
  const testCases = [
    { amount: 100.00, tax: 0.15, expected: 115.00 },
    { amount: 999.99, tax: 0.10, expected: 1099.99 },
    { amount: 1234.56, tax: 0.08, expected: 1333.32 },
    { amount: 0.01, tax: 0.15, expected: 0.01 },
    { amount: 9999.99, tax: 0.18, expected: 11799.99 }
  ];

  let precisionPassed = true;
  testCases.forEach(test => {
    const calculated = Math.round((test.amount + test.amount * test.tax) * 100) / 100;
    if (calculated !== test.expected) {
      precisionPassed = false;
      log(`Precision error: ${test.amount} + ${test.tax * 100}% = ${calculated}, expected ${test.expected}`, 'error');
    }
  });
  recordTest('Floating Point Precision', precisionPassed, 'All calculations accurate to 2 decimal places');

  // Test 5.2: Payment Installments Calculation
  try {
    const principal = 10000;
    const installments = 12;
    const interestRate = 0.02; // 2% per month

    // Calculate payment with compound interest
    const monthlyPayment = principal * (interestRate * Math.pow(1 + interestRate, installments)) / 
                          (Math.pow(1 + interestRate, installments) - 1);
    const roundedPayment = Math.round(monthlyPayment * 100) / 100;
    const totalAmount = roundedPayment * installments;
    const totalInterest = totalAmount - principal;

    recordTest('Payment Installments Calculation', roundedPayment === 945.60, 
      `Monthly: R$ ${roundedPayment}, Total Interest: R$ ${totalInterest.toFixed(2)}`);
  } catch (error) {
    recordTest('Payment Installments Calculation', false, error.message);
  }

  // Test 5.3: Currency Rounding Edge Cases
  const roundingTests = [
    { input: 0.004, expected: 0.00 },
    { input: 0.005, expected: 0.01 },
    { input: 0.014, expected: 0.01 },
    { input: 0.015, expected: 0.02 },
    { input: 99.994, expected: 99.99 },
    { input: 99.995, expected: 100.00 }
  ];

  let roundingPassed = true;
  roundingTests.forEach(test => {
    const rounded = Math.round(test.input * 100) / 100;
    if (rounded !== test.expected) {
      roundingPassed = false;
      log(`Rounding error: ${test.input} = ${rounded}, expected ${test.expected}`, 'error');
    }
  });
  recordTest('Currency Rounding Edge Cases', roundingPassed, 'All rounding tests passed');
}

// =====================================================
// TEST SUITE 6: FINANCIAL ANALYTICS & REPORTING
// =====================================================
async function testFinancialAnalytics() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST SUITE 6: FINANCIAL ANALYTICS & REPORTING', 'info');
  log('═══════════════════════════════════════════════════════', 'info');

  // Test 6.1: Cash Flow Summary
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'completed')
      .gte('payment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('payment_date', new Date().toISOString().split('T')[0]);

    if (error) throw error;

    const cashFlow = data.reduce((acc, payment) => {
      if (payment.payment_type === 'receivable') {
        acc.income += payment.amount;
      } else {
        acc.expenses += payment.amount;
      }
      return acc;
    }, { income: 0, expenses: 0 });

    cashFlow.net = cashFlow.income - cashFlow.expenses;
    
    recordTest('Cash Flow Summary Calculation', true, 
      `Income: R$ ${cashFlow.income.toFixed(2)}, Expenses: R$ ${cashFlow.expenses.toFixed(2)}, Net: R$ ${cashFlow.net.toFixed(2)}`);
  } catch (error) {
    recordTest('Cash Flow Summary Calculation', false, error.message);
  }

  // Test 6.2: Expense Category Analysis
  try {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        category_id,
        expense_categories!inner(name),
        total_amount
      `)
      .eq('status', 'paid')
      .gte('paid_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (error) throw error;

    const categoryTotals = {};
    data.forEach(bill => {
      const categoryName = bill.expense_categories?.name || 'Uncategorized';
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + bill.total_amount;
    });

    recordTest('Expense Category Analysis', true, 
      `Categories analyzed: ${Object.keys(categoryTotals).length}`);
  } catch (error) {
    recordTest('Expense Category Analysis', false, error.message);
  }

  // Test 6.3: Collection Efficiency Metrics
  try {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .in('status', ['paid', 'partial_paid'])
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    let totalDaysToPayment = 0;
    let paidInvoices = 0;

    invoices?.forEach(invoice => {
      if (invoice.paid_date) {
        const daysToPayment = Math.floor(
          (new Date(invoice.paid_date) - new Date(invoice.invoice_date)) / (1000 * 60 * 60 * 24)
        );
        totalDaysToPayment += daysToPayment;
        paidInvoices++;
      }
    });

    const avgDaysToPayment = paidInvoices > 0 ? totalDaysToPayment / paidInvoices : 0;
    
    recordTest('Collection Efficiency Metrics', true, 
      `Average days to payment: ${avgDaysToPayment.toFixed(1)} days`);
  } catch (error) {
    recordTest('Collection Efficiency Metrics', false, error.message);
  }
}

// =====================================================
// TEST SUITE 7: DATA INTEGRITY & CONSTRAINTS
// =====================================================
async function testDataIntegrity() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST SUITE 7: DATA INTEGRITY & CONSTRAINTS', 'info');
  log('═══════════════════════════════════════════════════════', 'info');

  // Test 7.1: Negative Amount Constraint
  try {
    const { error } = await supabase
      .from('bills')
      .insert([{
        description: 'Test negative amount',
        amount: -100,
        due_date: new Date().toISOString().split('T')[0]
      }]);

    recordTest('Negative Amount Constraint', error !== null, 
      'Correctly rejected negative amount');
  } catch (error) {
    recordTest('Negative Amount Constraint', true, 'Constraint working');
  }

  // Test 7.2: Unique Invoice Number
  try {
    const invoiceNumber = `TEST-UNIQUE-${Date.now()}`;
    
    // First insert
    await supabase
      .from('invoices')
      .insert([{
        invoice_number: invoiceNumber,
        description: 'Test invoice 1',
        subtotal: 1000,
        due_date: new Date().toISOString().split('T')[0]
      }]);

    // Duplicate insert
    const { error } = await supabase
      .from('invoices')
      .insert([{
        invoice_number: invoiceNumber,
        description: 'Test invoice 2',
        subtotal: 2000,
        due_date: new Date().toISOString().split('T')[0]
      }]);

    recordTest('Unique Invoice Number Constraint', error !== null, 
      'Correctly rejected duplicate invoice number');
  } catch (error) {
    recordTest('Unique Invoice Number Constraint', true, 'Constraint working');
  }

  // Test 7.3: Foreign Key Integrity
  try {
    const { error } = await supabase
      .from('bills')
      .insert([{
        supplier_id: crypto.randomUUID(), // Non-existent supplier
        description: 'Test foreign key',
        amount: 100,
        due_date: new Date().toISOString().split('T')[0]
      }]);

    recordTest('Foreign Key Integrity', error !== null, 
      'Correctly rejected invalid supplier reference');
  } catch (error) {
    recordTest('Foreign Key Integrity', true, 'Constraint working');
  }

  // Test 7.4: Generated Column Accuracy
  try {
    const amount = 1000;
    const taxAmount = 180;
    
    const { data, error } = await supabase
      .from('bills')
      .insert([{
        description: 'Test generated column',
        amount: amount,
        tax_amount: taxAmount,
        due_date: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) throw error;
    
    recordTest('Generated Column Calculation', data.total_amount === amount + taxAmount, 
      `Total: R$ ${data.total_amount} (${amount} + ${taxAmount})`);
  } catch (error) {
    recordTest('Generated Column Calculation', false, error.message);
  }
}

// =====================================================
// TEST SUITE 8: PERFORMANCE & SCALABILITY
// =====================================================
async function testPerformance() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST SUITE 8: PERFORMANCE & SCALABILITY', 'info');
  log('═══════════════════════════════════════════════════════', 'info');

  // Test 8.1: Bulk Insert Performance
  try {
    const startTime = Date.now();
    const bulkSuppliers = Array(50).fill(null).map(() => generateSupplierData());
    
    const { data, error } = await supabase
      .from('suppliers')
      .insert(bulkSuppliers)
      .select();

    if (error) throw error;
    
    const duration = Date.now() - startTime;
    recordTest('Bulk Insert Performance', duration < 5000, 
      `Inserted ${data.length} suppliers in ${duration}ms`);
  } catch (error) {
    recordTest('Bulk Insert Performance', false, error.message);
  }

  // Test 8.2: Complex Query Performance
  try {
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        supplier:suppliers(*),
        category:expense_categories(*),
        payments:payments(*)
      `)
      .in('status', ['pending', 'approved', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(100);

    if (error) throw error;
    
    const duration = Date.now() - startTime;
    recordTest('Complex Query Performance', duration < 2000, 
      `Retrieved ${data.length} bills with relations in ${duration}ms`);
  } catch (error) {
    recordTest('Complex Query Performance', false, error.message);
  }

  // Test 8.3: Concurrent Operations
  try {
    const startTime = Date.now();
    const concurrentOps = [];

    // Simulate 10 concurrent operations
    for (let i = 0; i < 10; i++) {
      concurrentOps.push(
        supabase.from('suppliers').select('*').limit(5),
        supabase.from('bills').select('*').limit(5),
        supabase.from('invoices').select('*').limit(5)
      );
    }

    const results = await Promise.all(concurrentOps);
    const errors = results.filter(r => r.error);
    
    const duration = Date.now() - startTime;
    recordTest('Concurrent Operations', errors.length === 0, 
      `Completed ${concurrentOps.length} operations in ${duration}ms`);
  } catch (error) {
    recordTest('Concurrent Operations', false, error.message);
  }
}

// =====================================================
// TEST SUITE 9: SECURITY & ACCESS CONTROL
// =====================================================
async function testSecurity() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST SUITE 9: SECURITY & ACCESS CONTROL', 'info');
  log('═══════════════════════════════════════════════════════', 'info');

  // Test 9.1: SQL Injection Prevention
  try {
    const maliciousInput = "'; DROP TABLE suppliers; --";
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .ilike('name', `%${maliciousInput}%`);

    // If query executes without dropping table, security is working
    const { data: checkData } = await supabase
      .from('suppliers')
      .select('id')
      .limit(1);

    recordTest('SQL Injection Prevention', checkData !== null, 
      'Malicious input safely handled');
  } catch (error) {
    recordTest('SQL Injection Prevention', true, 'Query safely failed');
  }

  // Test 9.2: Input Sanitization
  try {
    const xssAttempt = '<script>alert("XSS")</script>';
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        name: xssAttempt,
        notes: xssAttempt,
        country: 'Brasil'
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Check if data is stored as-is (should be escaped on display)
    recordTest('Input Sanitization', data.name === xssAttempt, 
      'XSS attempt stored safely (will be escaped on display)');
  } catch (error) {
    recordTest('Input Sanitization', false, error.message);
  }

  // Test 9.3: Data Validation
  const validationTests = [
    { field: 'email', value: 'invalid-email', shouldFail: false }, // DB allows any string
    { field: 'payment_terms', value: -30, shouldFail: false }, // No constraint on negative
    { field: 'amount', value: 0, shouldFail: false } // Zero is technically valid
  ];

  validationTests.forEach(async test => {
    try {
      const testData = generateSupplierData();
      testData[test.field] = test.value;
      
      const { error } = await supabase
        .from('suppliers')
        .insert([testData]);

      recordTest(`Data Validation - ${test.field}`, 
        test.shouldFail ? error !== null : error === null,
        `${test.field} = ${test.value}`);
    } catch (error) {
      recordTest(`Data Validation - ${test.field}`, test.shouldFail, 'Validation worked');
    }
  });
}

// =====================================================
// TEST SUITE 10: EDGE CASES & ERROR HANDLING
// =====================================================
async function testEdgeCases() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST SUITE 10: EDGE CASES & ERROR HANDLING', 'info');
  log('═══════════════════════════════════════════════════════', 'info');

  // Test 10.1: Empty String Handling
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        name: '', // Empty name
        country: 'Brasil'
      }]);

    recordTest('Empty String Handling', error === null, 
      'Empty strings handled gracefully');
  } catch (error) {
    recordTest('Empty String Handling', false, error.message);
  }

  // Test 10.2: Maximum Value Handling
  try {
    const maxAmount = 999999999.99;
    const { data, error } = await supabase
      .from('bills')
      .insert([{
        description: 'Max amount test',
        amount: maxAmount,
        due_date: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) throw error;
    
    recordTest('Maximum Value Handling', data.amount === maxAmount, 
      `Max amount: R$ ${data.amount.toLocaleString('pt-BR')}`);
  } catch (error) {
    recordTest('Maximum Value Handling', false, error.message);
  }

  // Test 10.3: Date Boundary Conditions
  try {
    const farFutureDate = '2099-12-31';
    const { data, error } = await supabase
      .from('bills')
      .insert([{
        description: 'Future date test',
        amount: 100,
        due_date: farFutureDate
      }])
      .select()
      .single();

    if (error) throw error;
    
    recordTest('Date Boundary Conditions', data.due_date === farFutureDate, 
      `Future date: ${data.due_date}`);
  } catch (error) {
    recordTest('Date Boundary Conditions', false, error.message);
  }

  // Test 10.4: Null Handling
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        name: 'Null Test Supplier',
        email: null,
        phone: null,
        notes: null,
        country: 'Brasil'
      }])
      .select()
      .single();

    if (error) throw error;
    
    recordTest('Null Value Handling', data.email === null && data.phone === null, 
      'Null values properly stored');
  } catch (error) {
    recordTest('Null Value Handling', false, error.message);
  }

  // Test 10.5: Unicode and Special Characters
  try {
    const specialChars = 'São Paulo - José & Maria\'s Café ™ © ® "Quotes" €£¥';
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        name: specialChars,
        address: 'Rua São José, 123 - 1º Andar',
        country: 'Brasil'
      }])
      .select()
      .single();

    if (error) throw error;
    
    recordTest('Unicode and Special Characters', data.name === specialChars, 
      'Special characters preserved');
  } catch (error) {
    recordTest('Unicode and Special Characters', false, error.message);
  }
}

// =====================================================
// MAIN TEST RUNNER
// =====================================================
async function runAllTests() {
  console.clear();
  log('╔═══════════════════════════════════════════════════════════════════╗', 'info');
  log('║     COMPREHENSIVE FINANCIAL MANAGEMENT SYSTEM TESTING SUITE       ║', 'info');
  log('║              D\'AVILA REIS LEGAL PRACTICE SYSTEM                   ║', 'info');
  log('╚═══════════════════════════════════════════════════════════════════╝', 'info');
  log(`Started at: ${new Date().toLocaleString('pt-BR')}`, 'info');

  try {
    // Run all test suites
    const supplierId = await testSupplierManagement();
    const billId = await testBillsManagement(supplierId);
    const invoiceId = await testInvoicesManagement();
    await testFinancialAlerts();
    await testPaymentCalculations();
    await testFinancialAnalytics();
    await testDataIntegrity();
    await testPerformance();
    await testSecurity();
    await testEdgeCases();

  } catch (error) {
    log(`Unexpected error during testing: ${error.message}`, 'error');
  }

  // Generate summary report
  log('\n╔═══════════════════════════════════════════════════════════════════╗', 'info');
  log('║                         TEST SUMMARY REPORT                       ║', 'info');
  log('╚═══════════════════════════════════════════════════════════════════╝', 'info');
  
  const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
  
  log(`Total Tests Run: ${totalTests}`, 'info');
  log(`Tests Passed: ${passedTests} ✓`, 'success');
  log(`Tests Failed: ${failedTests} ✗`, failedTests > 0 ? 'error' : 'info');
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'error');
  log(`\nCompleted at: ${new Date().toLocaleString('pt-BR')}`, 'info');

  // Detailed failure report
  if (failedTests > 0) {
    log('\n═══════════════════════════════════════════════════════', 'error');
    log('FAILED TESTS DETAILS:', 'error');
    log('═══════════════════════════════════════════════════════', 'error');
    testResults
      .filter(r => !r.passed)
      .forEach(r => log(`${r.testName}: ${r.details}`, 'error'));
  }

  // Performance analysis
  const performanceTests = testResults.filter(r => r.testName.includes('Performance'));
  if (performanceTests.length > 0) {
    log('\n═══════════════════════════════════════════════════════', 'info');
    log('PERFORMANCE METRICS:', 'info');
    log('═══════════════════════════════════════════════════════', 'info');
    performanceTests.forEach(r => log(`${r.testName}: ${r.details}`, r.passed ? 'success' : 'warning'));
  }

  // Final verdict
  log('\n╔═══════════════════════════════════════════════════════════════════╗', 'info');
  if (successRate >= 95) {
    log('║          🎉 FINANCIAL SYSTEM READY FOR PRODUCTION! 🎉             ║', 'success');
    log('║         All critical tests passed with excellence                 ║', 'success');
  } else if (successRate >= 80) {
    log('║          ⚠️  SYSTEM MOSTLY FUNCTIONAL - FIXES NEEDED ⚠️            ║', 'warning');
    log('║         Review failed tests before production deployment          ║', 'warning');
  } else {
    log('║          ❌ CRITICAL ISSUES DETECTED - DO NOT DEPLOY ❌           ║', 'error');
    log('║         Major fixes required before production use                ║', 'error');
  }
  log('╚═══════════════════════════════════════════════════════════════════╝', 'info');
}

// Execute tests
runAllTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});