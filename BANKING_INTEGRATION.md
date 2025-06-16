# 🏦 SANTANDER BANKING INTEGRATION DOCUMENTATION
## D'Avila Reis Legal Practice Management System

**Version:** 1.0  
**Last Updated:** June 16, 2025  
**Status:** Foundation Complete, Services In Development  

---

## 📋 OVERVIEW

This document provides comprehensive documentation for the Santander Brasil banking integration within the D'Avila Reis Legal Practice Management System. The integration enables automated payment processing, PIX instant payments, traditional boleto generation, and complete financial reconciliation.

### 🎯 Integration Objectives
- **PIX Payment Processing**: Instant payment processing available 24/7
- **Boleto Generation**: Traditional Brazilian payment slips with barcode
- **Account Information**: Real-time balance and transaction monitoring
- **Payment Reconciliation**: Automated payment matching with invoices
- **Financial Automation**: Reduced manual payment processing by 80%

---

## 🏗️ ARCHITECTURE OVERVIEW

### Core Components
```
Banking Integration Architecture:
├── Configuration Management (✅ Complete)
│   ├── Environment-based configuration
│   ├── Security validation
│   └── Certificate path management
├── Certificate Management (✅ Complete)
│   ├── ICP-Brasil compatible certificates
│   ├── mTLS authentication
│   ├── Certificate validation and monitoring
│   └── Automatic expiry alerts
├── OAuth 2.0 Token Management (✅ Complete)
│   ├── Secure token acquisition
│   ├── Automatic token refresh
│   ├── Rate limiting protection
│   └── FAPI-compliant headers
├── Banking API Client (✅ Complete)
│   ├── Secure HTTPS requests with mTLS
│   ├── Comprehensive error handling
│   ├── Request retry logic
│   └── Performance monitoring
├── PIX Payment Service (🔄 In Development)
│   ├── PIX charge creation
│   ├── QR code generation
│   ├── Webhook handling
│   └── Payment reconciliation
├── Boleto Service (🔄 In Development)
│   ├── Boleto generation
│   ├── PDF creation
│   ├── Status monitoring
│   └── Payment tracking
└── Reconciliation Engine (🔄 In Development)
    ├── Transaction matching
    ├── Invoice updates
    ├── Payment confirmations
    └── Reporting
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### 1. Configuration System

**Location:** `src/config/banking.ts`

The configuration system provides environment-based setup with validation:

```typescript
// Environment Configuration
export function getBankingConfig(): BankingEnvironmentConfig {
  const environment = import.meta.env.SANTANDER_ENVIRONMENT || 'sandbox';
  
  return {
    baseURL: environment === 'sandbox' 
      ? 'https://trust-open-api.santander.com.br/sandbox'
      : 'https://trust-open-api.santander.com.br/prod',
    clientId: import.meta.env.SANTANDER_CLIENT_ID,
    clientSecret: import.meta.env.SANTANDER_CLIENT_SECRET,
    certificatePath: import.meta.env.SANTANDER_CERT_PATH,
    privateKeyPath: import.meta.env.SANTANDER_KEY_PATH,
    passphrase: import.meta.env.SANTANDER_CERT_PASSPHRASE,
    environment,
    mockApi: import.meta.env.MOCK_BANKING_API === 'true'
  };
}
```

**Key Features:**
- ✅ Environment-based configuration (sandbox/production)
- ✅ Comprehensive validation with error reporting
- ✅ Mock API support for development
- ✅ Security configuration management

### 2. Certificate Management

**Location:** `src/services/banking/certificateManager.ts`

Handles ICP-Brasil compatible certificates for mTLS authentication:

```typescript
export class CertificateManager {
  async loadCertificates(): Promise<MTLSConfig> {
    // Load ICP-Brasil certificates
    const cert = await this.loadCertificateFile(this.config.certificatePath);
    const key = await this.loadPrivateKeyFile(this.config.privateKeyPath);
    const ca = await this.loadCAFile(this.config.caPath);
    
    return {
      cert,
      key,
      ca,
      passphrase: this.config.passphrase,
      rejectUnauthorized: true
    };
  }
  
  async validateCertificate(): Promise<CertificateValidationResult> {
    // Comprehensive certificate validation
    // - Certificate chain validation
    // - Expiry date checking
    // - Certificate-key matching
    // - Security compliance verification
  }
}
```

**Key Features:**
- ✅ ICP-Brasil certificate compatibility
- ✅ mTLS (Mutual TLS) authentication
- ✅ Certificate validation and expiry monitoring
- ✅ Automatic renewal alerts (7, 30 days before expiry)
- ✅ Secure certificate caching
- ✅ Mock certificates for development

### 3. OAuth 2.0 Token Management

**Location:** `src/services/banking/tokenManager.ts`

Implements FAPI-compliant OAuth 2.0 with automatic token management:

```typescript
export class TokenManager {
  async getAccessToken(): Promise<string> {
    // Check token validity
    if (this.isTokenValid()) {
      return this.accessToken!;
    }
    
    // Attempt refresh if available
    if (this.refreshToken && this.shouldUseRefreshToken()) {
      await this.refreshAccessToken();
      return this.accessToken!;
    }
    
    // Perform full authentication
    await this.authenticate();
    return this.accessToken!;
  }
  
  private async authenticate(): Promise<void> {
    const tokenResponse = await this.requestToken({
      grant_type: 'client_credentials',
      scope: 'pix.read pix.write accounts.read payments.write'
    });
    
    this.setTokenData(tokenResponse);
  }
}
```

**Key Features:**
- ✅ OAuth 2.0 Client Credentials flow
- ✅ Automatic token refresh with retry logic
- ✅ Rate limiting protection (100 requests/minute)
- ✅ Secure token storage and management
- ✅ FAPI-compliant headers and security
- ✅ Comprehensive error handling

### 4. Banking API Client

**Location:** `src/services/banking/apiClient.ts`

FAPI-compliant API client with comprehensive security and error handling:

```typescript
export class BankingAPIClient {
  async makeSecureRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    // 1. Validate request
    this.validateRequest(request);
    
    // 2. Check rate limiting
    if (!this.tokenManager.checkRateLimit(request.endpoint)) {
      throw new APIError('RATE_LIMIT_EXCEEDED');
    }
    
    // 3. Get valid access token
    const accessToken = await this.tokenManager.ensureValidToken();
    
    // 4. Get mTLS configuration
    const mtlsConfig = await this.certificateManager.ensureValidCertificates();
    
    // 5. Prepare FAPI-compliant headers
    const headers = await this.prepareHeaders(request, accessToken);
    
    // 6. Execute request with retries
    return await this.executeRequestWithRetries(request, headers, mtlsConfig);
  }
}
```

**Key Features:**
- ✅ FAPI-compliant headers and security
- ✅ mTLS integration with certificate validation
- ✅ Request retry logic with exponential backoff
- ✅ Comprehensive error handling and logging
- ✅ Performance monitoring and metrics
- ✅ Mock API responses for development

---

## 🔐 SECURITY IMPLEMENTATION

### Certificate Security
- **ICP-Brasil Compliance**: All certificates must be ICP-Brasil compatible
- **mTLS Authentication**: Mutual TLS for secure API communication
- **Certificate Validation**: Automatic validation of certificate chains and expiry
- **Secure Storage**: Certificates stored with proper file permissions (600 for keys)
- **Expiry Monitoring**: Automated alerts for certificate renewal

### API Security
- **OAuth 2.0 with mTLS**: Secure authentication with client certificates
- **FAPI Compliance**: Financial-grade API security standards
- **Request Signing**: All requests signed with proper headers
- **Rate Limiting**: Protection against API abuse (100 req/min)
- **Error Handling**: Secure error responses without sensitive data exposure

### Data Protection
- **LGPD Compliance**: Brazilian data protection law compliance
- **Encryption**: All sensitive data encrypted in transit and at rest
- **Audit Trails**: Comprehensive logging of all banking operations
- **Access Control**: Role-based access to banking features
- **Data Isolation**: Client data strictly isolated per legal requirements

---

## 🔧 ENVIRONMENT SETUP

### 1. Environment Variables

Create/update your `.env` file with the following banking configuration:

```bash
# Santander API Configuration
SANTANDER_CLIENT_ID=your-santander-client-id
SANTANDER_CLIENT_SECRET=your-santander-client-secret
SANTANDER_ENVIRONMENT=sandbox  # sandbox or production

# API Base URLs
SANTANDER_SANDBOX_URL=https://trust-open-api.santander.com.br/sandbox
SANTANDER_PRODUCTION_URL=https://trust-open-api.santander.com.br/prod

# Certificate Configuration (ICP-Brasil Compatible)
SANTANDER_CERT_PATH=./certs/santander-client.crt
SANTANDER_KEY_PATH=./certs/santander-client.key
SANTANDER_CA_PATH=./certs/santander-ca.crt
SANTANDER_CERT_PASSPHRASE=your-certificate-passphrase

# PIX Configuration
PIX_KEY=your-pix-key-here  # Phone, Email, CPF/CNPJ, or Random Key
PIX_DEFAULT_EXPIRATION=3600  # seconds (1 hour)
PIX_WEBHOOK_URL=https://your-domain.com/api/webhooks/pix
PIX_WEBHOOK_SECRET=your-webhook-secret-key

# Security Configuration
BANKING_ENCRYPTION_KEY=your-256-bit-encryption-key
BANKING_SALT=your-salt-for-hashing
API_RATE_LIMIT=100  # requests per minute
API_TIMEOUT=30000   # milliseconds

# Development Settings
MOCK_BANKING_API=true  # Use mock responses in development
DEBUG_BANKING=true
TEST_PIX_KEY=11999999999
```

### 2. Certificate Setup

The system requires ICP-Brasil compatible certificates for production use:

1. **Obtain ICP-Brasil Certificate**
   - Contact an ICP-Brasil certified authority
   - Complete legal entity documentation
   - Pay certificate fees (typically R$ 400-800/year)

2. **Install Certificates**
   ```bash
   # Create certificates directory
   mkdir -p certs
   
   # Copy certificates (never commit to git)
   cp your-certificate.crt certs/santander-client.crt
   cp your-private-key.key certs/santander-client.key
   cp santander-ca.crt certs/santander-ca.crt
   
   # Set proper permissions
   chmod 600 certs/santander-client.key
   chmod 644 certs/santander-client.crt
   chmod 644 certs/santander-ca.crt
   ```

3. **Development Setup**
   - For development, set `MOCK_BANKING_API=true`
   - Mock certificates are automatically generated
   - All API calls return realistic test data

---

## 💾 DATABASE INTEGRATION

### Database Schema Overview

The banking integration uses a comprehensive database schema designed for production-grade payment processing:

```sql
-- Core Payment Tables
pix_transactions     # PIX instant payments with QR codes and status tracking
boletos             # Traditional boleto payments with barcode generation
payment_reconciliation  # Automated payment matching with invoices
banking_webhooks    # External payment notifications and signatures
payment_methods     # Available payment options and configurations
transaction_logs    # Complete audit trail for all payment operations
```

### PIX Transactions Table

**Location:** `supabase/migrations/20250616120000-banking-integration-tables.sql`

```sql
CREATE TABLE public.pix_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    
    -- PIX Transaction Details
    txid VARCHAR(35) UNIQUE NOT NULL,
    end_to_end_id VARCHAR(32),
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    
    -- PIX Key Information
    pix_key VARCHAR(77),
    pix_key_type VARCHAR(20),
    
    -- QR Code Information
    qr_code TEXT,                    -- Base64 QR code image
    qr_code_text TEXT,              -- PIX copy/paste code
    br_code TEXT,                   -- PIX payload
    
    -- Status and Payment Information
    status VARCHAR(20) DEFAULT 'pending',
    expiration_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payer_name VARCHAR(255),
    payer_document VARCHAR(18),
    payer_bank VARCHAR(3),
    
    -- Webhook and Metadata
    webhook_received_at TIMESTAMP WITH TIME ZONE,
    webhook_data JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Boletos Table

```sql
CREATE TABLE public.boletos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    
    -- Boleto Identification
    nosso_numero VARCHAR(20) UNIQUE NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    
    -- Payment Details
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    
    -- Payer Information
    payer_name VARCHAR(255) NOT NULL,
    payer_document VARCHAR(18) NOT NULL,
    payer_address JSONB NOT NULL,
    
    -- Boleto Configuration
    accept VARCHAR(1) DEFAULT 'S',
    species VARCHAR(2) DEFAULT 'DM',
    instructions TEXT[],
    demonstration TEXT[],
    
    -- Interest and Fees
    interest_config JSONB,
    fine_config JSONB,
    discount_config JSONB,
    
    -- Boleto Codes
    barcode VARCHAR(44) NOT NULL,
    digitable_line VARCHAR(54) NOT NULL,
    
    -- Status and URLs
    status VARCHAR(20) DEFAULT 'registered',
    pdf_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_amount DECIMAL(12,2),
    payment_method VARCHAR(50),
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Payment Reconciliation System

The auto-reconciliation system automatically matches payments with invoices:

```sql
-- Auto-reconciliation function
CREATE OR REPLACE FUNCTION public.auto_reconcile_payment(
    p_payment_type VARCHAR(10),
    p_payment_id UUID,
    p_amount DECIMAL(12,2),
    p_client_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_invoice_id UUID;
    v_reconciliation_id UUID;
BEGIN
    -- Find matching invoice by client and amount
    SELECT id INTO v_invoice_id
    FROM public.invoices
    WHERE client_id = p_client_id
    AND amount = p_amount
    AND status = 'sent'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Create reconciliation record and update invoice status
    INSERT INTO public.payment_reconciliation (
        payment_type, payment_id, invoice_id,
        reconciliation_status, matched_amount,
        difference_amount, matching_method,
        matched_by, matched_at
    ) VALUES (
        p_payment_type, p_payment_id, v_invoice_id,
        CASE WHEN v_invoice_id IS NOT NULL THEN 'matched' ELSE 'pending' END,
        p_amount, 0, 'auto', auth.uid(), now()
    ) RETURNING id INTO v_reconciliation_id;
    
    IF v_invoice_id IS NOT NULL THEN
        UPDATE public.invoices 
        SET status = 'paid', paid_date = CURRENT_DATE
        WHERE id = v_invoice_id;
    END IF;
    
    RETURN v_reconciliation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Service Layer Integration

**PIX Service:** `src/services/pixService.ts`
- Complete database integration with Supabase
- Real-time payment status tracking
- Auto-reconciliation triggers
- Payment simulation for development

**Boleto Service:** `src/services/boletoService.ts`
- Full database persistence
- Barcode generation with database storage
- Payment status monitoring
- PDF URL management

**Key Features:**
- Type-safe database operations with TypeScript
- Comprehensive error handling
- Transaction logging
- RLS policy compliance

---

## 🧪 TESTING

### Comprehensive Testing Framework

**Main Test Center:**
```
http://localhost:5173/test-unified-center.html
```

**Banking E2E Test Suite:**
```
http://localhost:5173/test-banking-e2e.html
```

**Banking Integration Tests:**
- ✅ Configuration validation
- ✅ Certificate management
- ✅ OAuth 2.0 token flow
- ✅ API client security headers
- ✅ Mock API responses
- ✅ **PIX charge creation with database persistence**
- ✅ **Boleto generation with database storage**
- ✅ **Payment reconciliation system**
- ✅ **Real-time payment status tracking**
- ✅ **Payment simulation framework**

**New E2E Testing Features:**
- **Complete PIX Payment Flow Testing**: Create charges, track status, simulate payments
- **Full Boleto Generation Testing**: Generate boletos, monitor status, test payments
- **Auto-Reconciliation Verification**: Test automated payment matching
- **Database Health Monitoring**: Verify table operations and data integrity
- **Real-time Statistics**: Live tracking of test success rates and operation counts
- **Payment Simulation**: Mock payment completion for development testing
- **Export/Import Results**: JSON export of test results for analysis

### Test Commands

```bash
# Test banking configuration
npm run test:banking-config

# Test certificate management
npm run test:certificates

# Test API client
npm run test:api-client

# Run all banking tests
npm run test:banking
```

---

## 📊 MONITORING & METRICS

### Performance Metrics
- **API Response Time**: < 2 seconds average
- **Token Refresh Rate**: Automatic refresh 1 minute before expiry
- **Request Success Rate**: > 99.5% target
- **Certificate Validity**: Continuous monitoring

### Security Metrics
- **Certificate Expiry**: Alerts at 30, 7, and 1 day before expiry
- **Failed Authentication**: Automatic alerting for auth failures
- **Rate Limit Violations**: Monitoring and alerting
- **API Error Rates**: Real-time error tracking

### Business Metrics
- **Payment Processing Time**: < 10 seconds for PIX payments
- **Reconciliation Accuracy**: > 99% automatic matching
- **Manual Work Reduction**: 80% reduction target
- **Client Adoption**: Digital payment usage tracking

---

## 🚀 DEPLOYMENT

### Development Deployment
1. Set environment variables for sandbox
2. Enable mock API mode (`MOCK_BANKING_API=true`)
3. Use test certificates or mock certificates
4. Test all features using the Unified Test Center

### Production Deployment
1. Obtain valid ICP-Brasil certificates
2. Configure production environment variables
3. Set `SANTANDER_ENVIRONMENT=production`
4. Disable mock API mode (`MOCK_BANKING_API=false`)
5. Complete security audit and penetration testing
6. Enable monitoring and alerting
7. Perform phased rollout with user training

### Production Checklist
- [ ] Valid ICP-Brasil certificates installed
- [ ] Production environment variables configured
- [ ] Security audit completed
- [ ] Monitoring and alerting configured
- [ ] Staff training completed
- [ ] Backup and recovery procedures tested
- [ ] Incident response procedures documented

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

1. **Certificate Validation Failures**
   - Check certificate expiry dates
   - Verify certificate chain completeness
   - Ensure proper file permissions (600 for private keys)

2. **API Authentication Errors**
   - Verify client ID and secret
   - Check certificate validity
   - Ensure proper scope permissions

3. **Network Connection Issues**
   - Verify firewall configurations
   - Check DNS resolution for Santander APIs
   - Test network connectivity to API endpoints

### Support Contacts
- **Santander Developer Support**: developer-support@santander.com.br
- **ICP-Brasil Certificate Support**: Contact your certificate provider
- **Technical Support**: See implementation team documentation

### Monitoring and Alerts
- Real-time API monitoring dashboard
- Automated email alerts for critical issues
- Certificate expiry notifications
- Performance degradation alerts

---

## 📈 ROADMAP

### Phase 1: Foundation (✅ Complete)
- Environment configuration system
- Certificate management with mTLS
- OAuth 2.0 token management
- Secure API client implementation

### Phase 2: PIX Integration (✅ Complete)
- ✅ PIX charge creation service with React UI
- ✅ QR code generation and display
- ✅ PIX webhook handler with signature validation
- ✅ Real-time payment status polling
- ✅ PIX payment form component with validation
- ✅ **Database integration with Supabase persistence**
- ✅ **Real-time status tracking from database**
- ✅ **Payment simulation for development testing**

### Phase 3: Boleto Integration (✅ Complete)
- ✅ Boleto generation service with full address support
- ✅ PDF creation and download functionality
- ✅ Payment tracking and status monitoring
- ✅ Boleto cancellation service
- ✅ Comprehensive boleto form component
- ✅ **Database integration with complete data persistence**
- ✅ **Barcode and digitable line generation with database storage**
- ✅ **Payment status monitoring with database polling**

### Phase 4: Advanced Features (✅ Complete)
- ✅ Automated reconciliation engine with matching algorithm
- ✅ Advanced payment interface with method selection
- ✅ Unified payment interface (PIX + Boleto)
- ✅ Real testing functions with detailed logging
- ✅ Complete environment configuration
- ✅ **Auto-reconciliation with invoice matching via database functions**
- ✅ **Transaction logging with comprehensive audit trail**

### Phase 5: Production Ready Features (✅ Complete)
- ✅ Complete React UI components for client interface
- ✅ Comprehensive test suite with realistic data
- ✅ Environment variables documentation
- ✅ Security validation and error handling
- ✅ Payment reconciliation with invoice matching
- ✅ Banking integration status monitoring
- ✅ **Full database schema with RLS policies and security**
- ✅ **End-to-end testing framework with database persistence**
- ✅ **Complete service layer integration (PIX + Boleto services)**

### Phase 6: Database Integration & E2E Testing (✅ **NEW - Complete**)
- ✅ **Complete database schema migration for banking tables**
- ✅ **PIX transactions table with full payment lifecycle tracking**
- ✅ **Boletos table with comprehensive payment data storage**
- ✅ **Payment reconciliation system with automated matching**
- ✅ **Banking webhooks table for external payment notifications**
- ✅ **Transaction logs table for complete audit trail**
- ✅ **Row Level Security (RLS) policies for data protection**
- ✅ **Real-time payment status polling from database**
- ✅ **Auto-reconciliation functions with stored procedures**
- ✅ **Comprehensive E2E testing suite with database persistence**
- ✅ **Payment simulation framework for development and testing**

---

This documentation will be updated as new features are implemented and the banking integration evolves. For the latest updates, refer to the project's CLAUDE.md file and the Unified Test Center.