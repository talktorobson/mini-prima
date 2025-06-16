# CLAUDE.md - Direito Moderno Brasil (D'Avila Reis Legal Practice Management System)

## Project Overview

This is a comprehensive legal practice management system designed specifically for **D'Avila Reis Advogados**, a Brazilian law firm specializing in corporate and labor law. The system manages the complete lifecycle of legal services from client onboarding to billing and case closure.

## Business Context

**Target Users:**
- **Legal Staff**: Lawyers, paralegals, administrative staff managing cases
- **Clients**: Corporate clients accessing their legal matters via portal
- **Administrators**: System administrators managing users and configurations

**Practice Areas:**
- Labor Law (Direito Trabalhista)
- Civil Law (Direito Cível) 
- Corporate Law (Direito Empresarial)
- Legal Consulting (Consultoria Jurídica)

## System Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS + Radix UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **State Management**: TanStack Query for server state
- **Authentication**: Supabase Auth with Row Level Security (RLS)

### Database Structure
```
Core Entities:
├── clients (companies with legal matters)
├── cases (individual legal cases per client)
├── documents (case-related files and evidence)
├── financial_records (invoices, payments, billing)
├── staff (lawyers and administrative personnel)
├── staff_client_assignments (many-to-many staff-client relationships)
├── portal_messages (internal communication)
├── portal_notifications (system alerts and updates)
└── admin_users (system administrators)
```

## Current Implementation Status (~85% Complete)

### ✅ FULLY IMPLEMENTED
- **Authentication & Authorization**: Dual auth system (client + admin) with RLS
- **Admin Dashboard**: Complete system overview and management
- **Staff Role Management**: Permission-based access control
- **Basic Client Portal**: Dashboard, case viewing, document access
- **Document Storage**: Supabase storage with secure file handling
- **Basic Messaging**: Internal communication system
- **🚀 Legal-as-a-Service Platform**: Complete subscription management system
- **💰 Hybrid Billing Engine**: Multi-modal pricing with payment plans
- **📊 Business Intelligence**: MRR, CLV, churn analysis, growth projections
- **🎯 Dynamic Discount Matrix**: Subscription-based litigation discounts
- **💳 Payment Plan Calculator**: Compound interest installment system

### ⚠️ PARTIALLY IMPLEMENTED
- **Document Management**: Basic upload/view, missing case attachment
- **Case Management**: Viewing implemented, missing CRUD operations
- **Client Registration**: Form exists, missing approval workflow

### 🔄 NEXT PRIORITIES
- **Stripe Integration**: Automated subscription billing
- **Time Tracking**: Billable hours entry and management
- **Calendar System**: Court dates, deadlines, appointment scheduling
- **Document Workflows**: Case attachment and categorization

## Revolutionary Hybrid Legal-as-a-Service Business Model

### Advanced Billing System Architecture
The system implements a sophisticated hybrid revenue model combining traditional legal billing with subscription services:

```typescript
// Multi-Revenue Stream Architecture
interface HybridBillingSystem {
  // Traditional Case Billing
  caseBilling: {
    hourlyRate: number;           // R$/hour by staff level
    percentageRate: number;       // % of case total value
    fixedFee: number;            // Predetermined amount
    minimumFee: number;          // Per case type minimum
    successFee: {               // Êxito - percentage of recovery
      percentage: number;
      minimumRecovery: number;
      maximumFee: number;
    };
    paymentPlans: {             // Split payments into N installments
      installments: number;
      interestRate: number;
      downPayment: number;
    };
  };
  
  // Subscription Revenue Streams
  subscriptions: {
    laborLawConsulting: number;    // Monthly compliance consulting
    corporateLawConsulting: number; // Business legal advisory
    contractReviewService: number; // Document analysis quota
    legalHelpdesk: number;         // Unlimited legal questions
    templateAccess: number;       // Legal document library
    complianceMonitoring: number; // Regulatory updates
  };
  
  // Intelligent Cross-Selling Engine
  discountEngine: {
    subscriptionTier: 'basic' | 'professional' | 'enterprise';
    litigationType: string;
    discountPercentage: number;   // Automatic calculation
    crossSellConversion: number;  // Subscription to litigation rate
  };
}
```

### Revenue Model Innovation
- **Triple Revenue Streams**: Subscriptions + Case Billing + Success Fees
- **Payment Plan Financing**: Cases split into installments with interest
- **Dynamic Discount Matrix**: Subscribers get litigation discounts based on tier + case type
- **Monthly Recurring Revenue**: Predictable subscription income
- **Cross-selling Automation**: Convert subscribers to litigation clients

### Business Intelligence Requirements
- **MRR Tracking**: Monthly Recurring Revenue analytics
- **CLV Calculations**: Customer Lifetime Value projections
- **Churn Analysis**: Subscription cancellation patterns
- **Cross-sell Metrics**: Subscription to litigation conversion rates
- **Payment Plan Performance**: Default rates and collection efficiency

### Compliance Requirements
- **OAB Compliance**: Brazilian Bar Association requirements
- **LGPD**: Brazilian privacy law compliance
- **Court Integration**: Interface with Brazilian court systems (TJSP, TRT, etc.)
- **Document Standards**: Brazilian legal document templates

## Development Guidelines

### Code Standards
- **Naming Convention**: Use snake_case for database fields, camelCase for TypeScript
- **File Organization**: Group by feature, not by type
- **Component Structure**: Prefer composition over inheritance
- **Database**: Always use UUID for primary keys, include created_at/updated_at

### Security Requirements
- **Row Level Security**: All tables must have RLS policies
- **Data Isolation**: Staff can only access assigned clients
- **Audit Trails**: Log all significant actions for compliance
- **File Security**: Signed URLs for document access

### Brazilian Localization
- **Language**: All UI text in Portuguese (Brazil)
- **Currency**: Real (R$) formatting with proper decimals
- **Dates**: DD/MM/YYYY format
- **Phone**: Brazilian phone number formatting
- **CPF/CNPJ**: Brazilian tax ID validation and formatting

## Development Workflow

### Git Commit Guidelines
- **NO Claude signatures**: Never include "Generated with Claude Code" or Co-Authored-By
- **Descriptive messages**: Focus on business value, not technical details
- **Feature branches**: Create branches for each major feature
- **Small commits**: Commit frequently with focused changes

### Testing Strategy
- **Frontend Testing**: Create `/test-frontend.html` early and maintain throughout development
- **Database Testing**: Use Supabase migrations with proper rollback procedures
- **Integration Testing**: Test all API endpoints and database operations
- **User Acceptance Testing**: Validate with actual legal workflows

### Development Priorities
1. **Revenue Generation**: Billing and time tracking features first
2. **Compliance**: Deadline management and audit trails
3. **User Experience**: Intuitive interfaces for daily legal work
4. **Integration**: Brazilian court and banking system connections

## Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── admin/              # Admin-specific components
│   └── [feature]/          # Feature-specific components
├── pages/                  # Route-level pages
├── services/               # API and business logic
├── hooks/                  # Custom React hooks
├── contexts/               # React contexts (auth, etc.)
├── integrations/
│   └── supabase/          # Database client and types
├── lib/                   # Utility functions
└── utils/                 # Helper functions

supabase/
├── migrations/            # Database schema changes
└── config.toml           # Supabase configuration
```

## Key Implementation Notes

### Authentication Flow
- **Clients**: Standard Supabase auth with portal access
- **Staff**: Additional check against staff table for role determination
- **Admins**: Enhanced permissions via admin_users table

### Document Management
- **Storage**: Supabase Storage with organized folder structure
- **Security**: RLS policies ensure users only access permitted files
- **Preview**: PDF preview capability with download controls

### Database Relationships
- **One-to-Many**: Client → Cases, Cases → Documents
- **Many-to-Many**: Staff ↔ Clients (via assignments table)
- **Audit**: All tables include timestamps and modification tracking

## Immediate Development Priorities

Based on the **Roadmap MiniSystem V1.md**:

### Phase 1: Core Billing & Operations (Weeks 1-4)
1. **Advanced Billing System**: Multi-modal fee structures
2. **Time Tracking**: Billable hours with approval workflow
3. **Calendar Integration**: Court dates and deadline management
4. **Complete Client Onboarding**: Registration to active account

### Phase 2: Case Management & Documentation (Weeks 5-7)
1. **Case CRUD Operations**: Full case lifecycle management
2. **Document Workflows**: Upload, categorize, attach to cases
3. **Brazilian Legal Templates**: Standard legal document automation

## Success Metrics

### Technical Metrics
- **Performance**: Page load times < 2 seconds
- **Reliability**: 99.9% uptime for critical features
- **Security**: Zero data breaches or unauthorized access
- **Scalability**: Support for 100+ concurrent users

### Business Metrics
- **Time Tracking**: 95% of billable hours captured
- **Billing Accuracy**: 98% of invoices generated without errors
- **Client Satisfaction**: 90% portal adoption rate
- **Compliance**: Zero missed deadlines or regulatory violations

## Important Reminders

- **Keep It Simple**: Avoid over-engineering, focus on business value
- **Brazilian Focus**: All features must align with Brazilian legal practice
- **Data Security**: Client confidentiality is paramount
- **User Experience**: Lawyers need efficient, intuitive interfaces
- **Compliance First**: Regulatory requirements cannot be compromised

## Contact & Context

This system is being developed for a small Brazilian law firm with 20+ years of experience. The focus is on practical, daily-use features that improve efficiency and ensure compliance rather than complex enterprise features that won't be used.

**Key Stakeholder Needs:**
- **Partners**: Revenue visibility and business intelligence
- **Lawyers**: Efficient case and time management
- **Clients**: Transparent access to their legal matters
- **Staff**: Streamlined administrative workflows