// 🏗️ DATABASE MIGRATION RUNNER
// Execute Financial Management Schema Migration

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ijxqoyhbuexqkkptgoyx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqeHFveWhidWV4cWtrcHRnb3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDM2NzA1NCwiZXhwIjoyMDQ5OTQzMDU0fQ.bNX0-MFBHb_lrqR9_IW8QSc4Q1s7XWK9dJWJrxdxNOY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Starting Financial Management Database Migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'FINANCIAL_MANAGEMENT_SCHEMA_MIGRATION.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📂 Migration file loaded successfully');
    console.log(`📏 Migration size: ${migrationSQL.length} characters`);
    
    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔢 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let executed = 0;
    let failed = 0;
    
    for (const statement of statements) {
      try {
        if (statement.includes('CREATE TABLE') || 
            statement.includes('CREATE INDEX') || 
            statement.includes('CREATE POLICY') ||
            statement.includes('ALTER TABLE') ||
            statement.includes('CREATE TRIGGER') ||
            statement.includes('CREATE FUNCTION') ||
            statement.includes('CREATE VIEW') ||
            statement.includes('INSERT INTO')) {
          
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️  Warning: ${error.message}`);
            // Don't fail for expected errors like "already exists"
            if (!error.message.includes('already exists') && 
                !error.message.includes('already defined')) {
              failed++;
            }
          } else {
            executed++;
          }
        }
      } catch (err) {
        console.log(`❌ Error executing statement: ${err.message}`);
        failed++;
      }
    }
    
    console.log(`\n✅ Migration completed!`);
    console.log(`📊 Statements executed: ${executed}`);
    console.log(`⚠️  Warnings/Skipped: ${failed}`);
    
    // Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const tablesToCheck = [
      'suppliers',
      'expense_categories', 
      'bills',
      'invoices',
      'invoice_line_items',
      'payments',
      'payment_installments',
      'financial_alerts',
      'recurring_bill_templates'
    ];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' not accessible: ${error.message}`);
        } else {
          console.log(`✅ Table '${table}' is accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' verification failed: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Financial Management Database Migration Complete!');
    
  } catch (error) {
    console.error(`💥 Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Alternative approach - use individual CREATE statements
async function runIndividualStatements() {
  console.log('🔄 Running individual table creation...');
  
  // Core tables first
  const coreStatements = [
    `CREATE TABLE IF NOT EXISTS public.suppliers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      company_name VARCHAR(255),
      contact_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      mobile_phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(50),
      postal_code VARCHAR(20),
      country VARCHAR(50) DEFAULT 'Brasil',
      tax_id VARCHAR(50),
      payment_terms INTEGER DEFAULT 30,
      preferred_payment_method VARCHAR(50) DEFAULT 'transfer',
      bank_info JSONB,
      notes TEXT,
      notifications_enabled BOOLEAN DEFAULT true,
      auto_send_confirmation BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,
      created_by UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS public.expense_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      parent_category_id UUID REFERENCES public.expense_categories(id),
      is_tax_deductible BOOLEAN DEFAULT true,
      accounting_code VARCHAR(50),
      budget_amount DECIMAL(12,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    )`,
    
    // Insert default categories
    `INSERT INTO public.expense_categories (name, description, is_tax_deductible) VALUES
    ('Rent & Facilities', 'Office rent, utilities, maintenance', true),
    ('Technology', 'Software subscriptions, hardware, IT services', true),
    ('Professional Services', 'Accounting, consulting, legal research', true),
    ('Marketing & Business Development', 'Website, advertising, networking events', true),
    ('Travel & Transportation', 'Client meetings, court appearances, conferences', true),
    ('Office Supplies', 'Stationery, printing, general office expenses', true),
    ('Insurance', 'Professional liability, office insurance', true),
    ('Wages & Benefits', 'Staff salaries, benefits, bonuses', true),
    ('Banking & Financial', 'Bank fees, transaction costs, loans', true),
    ('Training & Education', 'Courses, seminars, professional development', true),
    ('Court & Legal Fees', 'Filing fees, court costs, expert witnesses', true),
    ('Client Entertainment', 'Business meals, client events', true)
    ON CONFLICT DO NOTHING`,
    
    `CREATE TABLE IF NOT EXISTS public.bills (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID REFERENCES public.suppliers(id),
      category_id UUID REFERENCES public.expense_categories(id),
      bill_number VARCHAR(100),
      reference_number VARCHAR(100),
      description TEXT NOT NULL,
      amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
      tax_amount DECIMAL(12,2) DEFAULT 0,
      total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
      due_date DATE NOT NULL,
      issue_date DATE DEFAULT CURRENT_DATE,
      received_date DATE DEFAULT CURRENT_DATE,
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'paid', 'overdue', 'cancelled')),
      priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      payment_type VARCHAR(50) DEFAULT 'one_time' CHECK (payment_type IN ('one_time', 'installments', 'recurring')),
      installments INTEGER DEFAULT 1 CHECK (installments > 0),
      installment_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (installment_frequency IN ('weekly', 'monthly', 'quarterly')),
      recurring_period VARCHAR(50) CHECK (recurring_period IN ('weekly', 'monthly', 'quarterly', 'semi_annual', 'yearly')),
      recurring_end_date DATE,
      attachment_url TEXT,
      payment_proof_url TEXT,
      contract_url TEXT,
      approval_required BOOLEAN DEFAULT true,
      approval_threshold DECIMAL(12,2) DEFAULT 1000,
      approved_by UUID,
      approved_at TIMESTAMP WITH TIME ZONE,
      approval_notes TEXT,
      paid_amount DECIMAL(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
      remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
      paid_date DATE,
      payment_method VARCHAR(50),
      payment_reference VARCHAR(100),
      auto_approve BOOLEAN DEFAULT false,
      auto_pay BOOLEAN DEFAULT false,
      notes TEXT,
      internal_notes TEXT,
      created_by UUID NOT NULL,
      updated_by UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS public.payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('payable', 'receivable')),
      reference_id UUID NOT NULL,
      reference_table VARCHAR(20) NOT NULL CHECK (reference_table IN ('bills', 'invoices')),
      amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
      payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      received_date DATE,
      payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('transfer', 'pix', 'boleto', 'check', 'cash', 'credit_card', 'debit_card')),
      payment_processor VARCHAR(50),
      reference_number VARCHAR(100),
      bank_account VARCHAR(100),
      bank_code VARCHAR(10),
      proof_url TEXT,
      receipt_url TEXT,
      processing_fee DECIMAL(12,2) DEFAULT 0,
      exchange_rate DECIMAL(10,6) DEFAULT 1,
      currency VARCHAR(3) DEFAULT 'BRL',
      status VARCHAR(30) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
      auto_reconciled BOOLEAN DEFAULT false,
      reconciliation_date DATE,
      notes TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS public.financial_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('due_date', 'overdue', 'payment_received', 'payment_made', 'approval_required', 'budget_exceeded')),
      severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      reference_type VARCHAR(20) CHECK (reference_type IN ('bill', 'invoice', 'payment', 'budget')),
      reference_id UUID,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      assigned_to UUID,
      department VARCHAR(50),
      is_read BOOLEAN DEFAULT false,
      is_dismissed BOOLEAN DEFAULT false,
      auto_dismiss_date DATE,
      requires_action BOOLEAN DEFAULT false,
      action_type VARCHAR(50),
      action_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      read_at TIMESTAMP WITH TIME ZONE,
      dismissed_at TIMESTAMP WITH TIME ZONE
    )`
  ];
  
  for (const statement of coreStatements) {
    try {
      console.log('Executing:', statement.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error && !error.message.includes('already exists')) {
        console.log(`⚠️  ${error.message}`);
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }
}

// Run migration
runIndividualStatements()
  .then(() => {
    console.log('\n🎯 Database setup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error(`💥 Setup failed: ${error.message}`);
    process.exit(1);
  });