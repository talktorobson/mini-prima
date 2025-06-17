# 🚀 Subscription Management Migration Instructions

## Overview
This migration creates the complete Legal-as-a-Service subscription management system for D'Avila Reis Advogados.

## Apply Migration Steps

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project: `mini-prima`
   - Go to SQL Editor

2. **Run the Migration**
   - Copy the entire contents of `SUBSCRIPTION_SCHEMA_MIGRATION.sql`
   - Paste into Supabase SQL Editor
   - Click "Run" to execute

3. **Verify Migration**
   - Check that these tables were created:
     - `subscription_plans` (5 default plans)
     - `client_subscriptions`
     - `subscription_usage`
     - `service_types` (5 default services)
     - `case_billing_config`
     - `payment_installments`

## Test After Migration

1. **Frontend Testing**
   - Open `test-frontend.html` in browser
   - Click "Apply Migration" (may fail - that's ok)
   - Click "Test Plans" to verify subscription plans
   - Test payment plan calculator
   - Test discount matrix calculator

2. **Admin Interface**
   - Navigate to http://localhost:8080/admin/subscriptions
   - Should see subscription analytics dashboard
   - Should show 5 default subscription plans
   - Can create new plans via the interface

## Default Plans Created

1. **Básico Trabalhista** - R$ 899/month
   - 2h consulting, 5 documents, 10 questions
   - 15% litigation discount

2. **Profissional Trabalhista** - R$ 1,899/month  
   - 5h consulting, 15 documents, 25 questions
   - 25% litigation discount

3. **Básico Empresarial** - R$ 1,299/month
   - 3h consulting, 8 documents, 15 questions  
   - 15% litigation discount

4. **Profissional Empresarial** - R$ 2,499/month
   - 8h consulting, 20 documents, 40 questions
   - 25% litigation discount

5. **Empresarial Completo** - R$ 4,999/month
   - 20h consulting, 50 documents, 100 questions
   - 30% litigation discount

## Features Enabled

✅ **Subscription Management**
- Multiple plan tiers (Basic/Professional/Enterprise)
- Usage tracking and quotas
- Automatic billing cycles

✅ **Payment Plans**
- Split case fees into N installments
- Compound interest calculations
- Down payment support

✅ **Discount Engine**  
- Dynamic discounts based on subscription tier
- Litigation type specific discounts
- Automatic cross-sell pricing

✅ **Business Intelligence**
- MRR (Monthly Recurring Revenue) tracking
- Cross-sell conversion analytics
- Customer lifetime value projections

## Next Steps After Migration

1. Test all subscription functionality
2. Configure Stripe integration for payments
3. Test case billing with subscription discounts
4. Set up automated subscription renewal
5. Implement subscription usage tracking in portal

## Troubleshooting

**If migration fails:**
- Check for existing table conflicts
- Ensure RLS helper functions exist
- Apply migration in smaller chunks if needed

**If plans don't appear:**
- Verify RLS policies are correct
- Check user permissions
- Confirm tables were created successfully