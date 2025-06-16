# Environment Setup - D'Avila Reis Legal Practice Management System

## Overview

This document describes the environment variable configuration for the Legal Practice Management System. The system uses environment variables to manage configuration across different environments (development, staging, production).

## Environment Files

### `.env.local` (Development)
Contains actual values for local development. **This file is gitignored** and should not be committed.

### `.env.example` (Template)
Template file showing all required environment variables. **This file is committed** to provide setup guidance.

## Environment Variables

### Core Configuration

#### Supabase (Database & Authentication)
```bash
VITE_SUPABASE_URL=https://cmgtjqycneerfdxmdmwp.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Application Settings
```bash
VITE_APP_NAME="D'Avila Reis Advogados"
VITE_APP_VERSION="1.0.0"
VITE_ENVIRONMENT=development  # development | staging | production
```

### Brazilian Legal System Integration

#### Court System APIs
```bash
VITE_TJSP_API_URL=https://api.tjsp.gov.br          # São Paulo State Court
VITE_TRT_API_URL=https://api.trt.gov.br            # Labor Court
```

### Payment Integration

#### Stripe (International Payments)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

#### PIX (Brazilian Instant Payment)
```bash
VITE_PIX_API_URL=https://api.pix.bcb.gov.br
```

### Communication

#### WhatsApp Business API
```bash
VITE_WHATSAPP_BUSINESS_API_URL=https://graph.facebook.com/v17.0
VITE_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

#### Email Configuration
```bash
VITE_SMTP_HOST=your_smtp_host
VITE_SMTP_PORT=587
VITE_SMTP_USER=your_smtp_user
VITE_FROM_EMAIL=noreply@davilareisadvogados.com.br
```

### File Upload Configuration

```bash
VITE_MAX_FILE_SIZE=10485760                         # 10MB in bytes
VITE_ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,xls,xlsx
```

### Development & Debug

```bash
VITE_DEBUG_MODE=true                                # Enable debug logging
VITE_SHOW_QUERY_DEVTOOLS=true                      # Show TanStack Query devtools
```

## Setup Instructions

### 1. Initial Setup
```bash
# Copy the example file
cp .env.example .env.local

# Edit with your actual values
nano .env.local
```

### 2. Required Variables
At minimum, you need:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Optional Variables
Other variables have sensible defaults and can be configured as needed for additional features.

## Environment Access

### Using the Environment Configuration
```typescript
// Import the environment configuration
import { env, supabaseConfig, debugConfig } from '@/lib/env';

// Access specific configurations
const supabaseUrl = supabaseConfig.url;
const isDebugMode = debugConfig.debugMode;
const maxFileSize = env.files.maxFileSize;
```

### Direct Environment Variable Access
```typescript
// Direct access (not recommended for complex configurations)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

## Environment-Specific Configuration

### Development
- Debug mode enabled
- Query devtools visible
- Detailed logging
- Hot reloading enabled

### Staging
- Debug mode disabled
- Production-like settings
- Limited logging
- Performance monitoring

### Production
- All debug features disabled
- Optimized builds
- Error tracking
- Performance monitoring
- Security hardening

## Security Considerations

### Public vs Private Variables
- **VITE_** prefixed variables are exposed to the client
- Never put sensitive data in VITE_ variables
- Use server-side environment variables for secrets

### Sensitive Information
- Database passwords
- Private API keys
- Email credentials
- Payment processor secrets

These should be handled server-side or through secure configuration management.

## Validation

The system automatically validates required environment variables on startup:

```typescript
// Environment validation
import { validateEnvironment } from '@/lib/env';

// Called automatically on app startup
validateEnvironment();
```

Missing required variables will:
- Log warnings in development
- Throw errors in production
- Provide helpful error messages

## Integration with Supabase

The Supabase client is configured to use environment variables:

```typescript
// Automatic configuration
export const supabase = createClient<Database>(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
```

## Deployment

### Vercel
Set environment variables in the Vercel dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add all required VITE_ variables
4. Deploy

### Other Platforms
Ensure all VITE_ prefixed variables are set in your deployment environment.

## Troubleshooting

### Common Issues

#### "Environment variable not found"
- Check if the variable is prefixed with `VITE_`
- Verify the variable exists in your `.env.local` file
- Restart the development server

#### "Supabase connection failed"
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check network connectivity
- Verify Supabase project is active

#### "Build errors"
- Ensure all required environment variables are set
- Check for typos in variable names
- Verify .env.local is properly formatted

### Debug Steps

1. **Check Environment Loading**
```bash
# Start with debug mode
VITE_DEBUG_MODE=true npm run dev
```

2. **Verify Variable Access**
```typescript
// Add to your component
console.log('Environment:', import.meta.env);
```

3. **Test Supabase Connection**
```typescript
// Add to your component
import { supabase } from '@/integrations/supabase/client';
console.log('Supabase client:', supabase);
```

## Future Integrations

The environment configuration is prepared for future integrations:

- **Brazilian Court Systems**: TJSP, TRT, TST APIs
- **Payment Processing**: Stripe, PIX, boleto
- **Communication**: WhatsApp Business, Email
- **Document Management**: Digital signatures, OCR
- **Compliance**: OAB integration, LGPD compliance

## Support

For environment setup issues:
1. Check this documentation
2. Verify `.env.local` against `.env.example`
3. Check the browser console for errors
4. Review the application logs

## Current Status

✅ **Configured and Working:**
- Supabase integration
- Basic application configuration
- Development environment
- Build process

🔄 **Planned Integrations:**
- Brazilian court systems
- Payment processing
- WhatsApp Business API
- Email configuration

📋 **Next Steps:**
- Configure production environment variables
- Set up staging environment
- Implement Brazilian legal system integrations
- Add payment processing configuration