# 🌱 Mini Prima Database Seeding Guide

## Overview

This seeding script provides comprehensive test data for the Mini Prima legal practice management system, enabling full End-to-End (E2E) testing with realistic Brazilian legal practice scenarios.

## 📊 Data Coverage

### Core Business Data
- **5 Realistic Client Companies** with proper Brazilian CNPJ formatting
- **5 Active Legal Cases** covering Labor, Corporate, and Regulatory law
- **4 Staff Members** (2 lawyers, 1 paralegal, 1 secretary) with OAB numbers
- **2 Admin Users** with different permission levels

### Financial Management
- **4 Suppliers** for operational expenses
- **7 Expense Categories** (rent, technology, accounting, etc.)
- **Bills & Invoices** with different statuses (pending, paid, overdue)
- **Payment Records** with proper audit trails

### Legal-Specific Features
- **Brazilian Court Integrations** (TJSP, TRT, TRF)
- **Legal Deadlines** with priority levels and court assignments
- **OAB Compliance Tracking** for lawyers
- **Case Workflow Phases** with Brazilian legal procedures
- **Legal Document Templates** (Labor, Civil, Corporate)
- **Brazilian Holiday Calendar** affecting legal deadlines

### Subscription & Billing
- **4 Subscription Plans** (Basic, Professional, Enterprise, Annual)
- **3 Active Subscriptions** with usage tracking
- **Time Tracking Entries** with approval workflows
- **Payment Plans** with Brazilian Real formatting

### Communication System
- **Portal Messages** between clients and lawyers
- **System Notifications** for deadlines and updates
- **Usage Analytics** for subscription monitoring

## 🚀 Quick Start

### Step 1: Prepare Your Environment

Ensure you have:
- ✅ Supabase project set up
- ✅ All database migrations applied
- ✅ RLS policies configured
- ✅ Environment variables set

### Step 2: Create Authentication Users

**IMPORTANT**: Create these users in Supabase Auth Dashboard **BEFORE** running the seed script:

```bash
# Admin Users
admin@davilareisadvogados.com.br (Password: TestAdmin123!)

# Staff Users  
lawyer1@davilareisadvogados.com.br (Password: TestLawyer123!)
lawyer2@davilareisadvogados.com.br (Password: TestLawyer123!)
staff1@davilareisadvogados.com.br (Password: TestStaff123!)

# Client Users
client1@empresa.com.br (Password: TestClient123!)
client2@corporacao.com.br (Password: TestClient123!)
client3@startup.com.br (Password: TestClient123!)
```

### Step 3: Run the Seeding Script

```bash
# Using the production-ready version (recommended)
supabase db reset --seed seed-database-production.sql

# Alternative versions:
# supabase db reset --seed seed-database-final.sql
# supabase db reset --seed seed-database-corrected.sql
```

### Step 4: Configure Admin Users (Manual Step)

After seeding, manually add admin user records:

1. Get the auth user IDs from Supabase Dashboard → Authentication → Users
2. Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO admin_users (user_id, role, permissions, is_active) VALUES
('your-admin-auth-user-id', 'admin', 
 '["all_access", "user_management", "billing_management", "system_settings"]'::jsonb, true),
('your-staff-auth-user-id', 'admin', 
 '["case_management", "billing_management", "client_management"]'::jsonb, true);
```

### Step 5: Verify Data Creation

The script will output a success message confirming all data was created. You should see:

```
=============================================================================
MINI PRIMA DATABASE SEEDING COMPLETED SUCCESSFULLY! (PRODUCTION VERSION)
=============================================================================
```

## 🧪 Testing Scenarios Enabled

### Authentication Testing
- **Admin Login**: Full system access with all permissions
- **Lawyer Login**: Case management, client access, time tracking
- **Staff Login**: Limited access based on role permissions
- **Client Login**: Portal access to their cases and documents

### Financial Management Testing
- **Accounts Payable**: Bills with different statuses and due dates
- **Accounts Receivable**: Client invoices with payment tracking
- **Supplier Management**: Complete vendor lifecycle
- **Payment Processing**: Various payment methods and statuses

### Legal Workflow Testing
- **Case Management**: Complete case lifecycle from creation to closure
- **Document Management**: File uploads, categorization, access control
- **Time Tracking**: Billable hours with approval workflows
- **Deadline Management**: Brazilian court calendar integration

### Brazilian Legal Compliance
- **OAB Compliance**: Professional conduct monitoring
- **Court Integration**: Deadline calculation with Brazilian holidays
- **Legal Templates**: Document generation with variable substitution
- **Workflow Automation**: Case phase management

### Subscription & Billing
- **Multi-tier Plans**: Basic, Professional, Enterprise subscriptions
- **Usage Tracking**: Service consumption monitoring
- **Payment Processing**: Brazilian payment methods (PIX, Boleto)
- **Discount Engine**: Subscription-based litigation discounts

## 📈 Test Data Statistics

| Category | Count | Details |
|----------|-------|---------|
| **Companies** | 5 | 4 approved clients + 1 pending |
| **Legal Cases** | 5 | Labor, Corporate, Civil law cases |
| **Documents** | 5 | Contracts, evidence, legal documents |
| **Staff Members** | 4 | 2 lawyers, 1 paralegal, 1 secretary |
| **Financial Records** | 11 | 4 bills + 3 invoices + 4 payments |
| **Subscriptions** | 3 | Active subscription relationships |
| **Time Entries** | 3 | With approval workflow states |
| **Legal Deadlines** | 3 | Court-specific deadline tracking |
| **Court Integrations** | 3 | TJSP, TRT, TRF connections |
| **Legal Templates** | 3 | Labor, Civil, Corporate templates |
| **Messages** | 3 | Client-lawyer communications |
| **Notifications** | 3 | System alerts and updates |

## 🎯 Key Test Scenarios

### 1. Complete Client Journey
1. **Registration**: New client approval workflow
2. **Case Creation**: Legal matter assignment to lawyers
3. **Document Upload**: Secure file management
4. **Time Tracking**: Billable hours and approval
5. **Billing**: Invoice generation and payment
6. **Portal Access**: Client self-service capabilities

### 2. Financial Management Workflow
1. **Supplier Registration**: Vendor onboarding
2. **Bill Processing**: Approval workflow and payment
3. **Client Billing**: Case-based invoice generation
4. **Payment Tracking**: Receipt management and reconciliation
5. **Financial Reporting**: Analytics and exports

### 3. Brazilian Legal Compliance
1. **Deadline Tracking**: Court calendar integration
2. **OAB Monitoring**: Professional compliance checks
3. **Case Workflows**: Automated legal procedures
4. **Document Generation**: Template-based legal documents

### 4. Subscription Business Model
1. **Plan Management**: Multi-tier subscription options
2. **Usage Monitoring**: Service consumption tracking
3. **Cross-selling**: Subscription to litigation conversion
4. **Payment Processing**: Brazilian payment methods

## 🔧 Customization Options

### Adding More Test Data

To expand the test dataset:

```sql
-- Add more clients
INSERT INTO clients (company_name, cnpj, email, ...) VALUES 
('New Company', '12.345.678/0001-99', 'new@company.com.br', ...);

-- Add more cases
INSERT INTO cases (client_id, case_number, title, ...) VALUES 
((SELECT id FROM clients WHERE company_name = 'New Company'), ...);
```

### Modifying Test Scenarios

Edit the script to:
- Change subscription plans and pricing
- Adjust case types and statuses
- Modify financial amounts and dates
- Update Brazilian legal compliance data

## 📚 Related Documentation

- **Database Schema**: See `supabase/migrations/` for table structures
- **Testing Framework**: See `test-unified-center.html` for E2E testing
- **API Documentation**: See service files in `src/services/`
- **Frontend Testing**: See component test files for UI validation

## ⚠️ Important Notes

### Security Considerations
- **RLS Policies**: Ensure Row Level Security is properly configured
- **Authentication**: Test users have realistic permissions
- **Data Isolation**: Clients can only access their own data

### Performance Testing
- Script creates realistic data volumes for performance testing
- Use with concurrent user testing for load validation
- Monitor query performance with complex data relationships

### Brazilian Compliance
- All dates use Brazilian format (DD/MM/YYYY)
- Currency amounts in Brazilian Real (R$)
- CNPJ/CPF formatting follows Brazilian standards
- Legal procedures follow Brazilian court system

## 🐛 Troubleshooting

### Common Issues

**Authentication Users Not Found**
- Ensure all auth users are created in Supabase before running script
- Check email addresses match exactly (case-sensitive)

**Foreign Key Violations**
- Run migrations in correct order before seeding
- Ensure all referenced tables exist

**RLS Policy Errors**
- Temporarily disable RLS during seeding if needed
- Re-enable RLS after seeding completes

**Large Dataset Performance**
- For production use, consider staged seeding
- Monitor memory usage during script execution

## 📞 Support

For issues with the seeding script:
1. Check Supabase logs for specific error messages
2. Verify all migrations are applied correctly
3. Ensure authentication users exist before seeding
4. Test with smaller data subsets first

---

**Ready for Production-Level E2E Testing!** 🚀

This comprehensive seed script provides everything needed for thorough testing of the Mini Prima legal practice management system with realistic Brazilian legal practice data.