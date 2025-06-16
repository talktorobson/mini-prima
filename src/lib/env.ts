// Environment configuration for the Legal Practice Management System
// This file centralizes all environment variable access with proper typing and validation

interface EnvironmentConfig {
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
  };
  
  // Application Configuration
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  
  // Brazilian Legal System Integration
  legal: {
    tjspApiUrl: string;
    trtApiUrl: string;
  };
  
  // Payment Configuration
  payments: {
    stripePublishableKey?: string;
    pixApiUrl: string;
  };
  
  // WhatsApp Business API
  whatsapp: {
    businessApiUrl: string;
    phoneNumberId?: string;
  };
  
  // Email Configuration
  email: {
    smtpHost?: string;
    smtpPort: number;
    smtpUser?: string;
    fromEmail: string;
  };
  
  // File Upload Configuration
  files: {
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  
  // Debug Configuration
  debug: {
    debugMode: boolean;
    showQueryDevtools: boolean;
  };
}

// Helper function to get environment variable with fallback
function getEnvVar(key: string, fallback?: string): string {
  const value = import.meta.env[key] || fallback;
  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
    return '';
  }
  return value;
}

// Helper function to get boolean environment variable
function getEnvBoolean(key: string, fallback: boolean = false): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

// Helper function to get number environment variable
function getEnvNumber(key: string, fallback: number): number {
  const value = import.meta.env[key];
  if (value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

// Create and export the environment configuration
export const env: EnvironmentConfig = {
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL', 'https://cmgtjqycneerfdxmdmwp.supabase.co'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI'),
  },
  
  app: {
    name: getEnvVar('VITE_APP_NAME', "D'Avila Reis Advogados"),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    environment: (getEnvVar('VITE_ENVIRONMENT', 'development') as 'development' | 'staging' | 'production'),
  },
  
  legal: {
    tjspApiUrl: getEnvVar('VITE_TJSP_API_URL', 'https://api.tjsp.gov.br'),
    trtApiUrl: getEnvVar('VITE_TRT_API_URL', 'https://api.trt.gov.br'),
  },
  
  payments: {
    stripePublishableKey: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY'),
    pixApiUrl: getEnvVar('VITE_PIX_API_URL', 'https://api.pix.bcb.gov.br'),
  },
  
  whatsapp: {
    businessApiUrl: getEnvVar('VITE_WHATSAPP_BUSINESS_API_URL', 'https://graph.facebook.com/v17.0'),
    phoneNumberId: getEnvVar('VITE_WHATSAPP_PHONE_NUMBER_ID'),
  },
  
  email: {
    smtpHost: getEnvVar('VITE_SMTP_HOST'),
    smtpPort: getEnvNumber('VITE_SMTP_PORT', 587),
    smtpUser: getEnvVar('VITE_SMTP_USER'),
    fromEmail: getEnvVar('VITE_FROM_EMAIL', 'noreply@davilareisadvogados.com.br'),
  },
  
  files: {
    maxFileSize: getEnvNumber('VITE_MAX_FILE_SIZE', 10485760), // 10MB default
    allowedFileTypes: getEnvVar('VITE_ALLOWED_FILE_TYPES', 'pdf,doc,docx,jpg,jpeg,png,xls,xlsx').split(','),
  },
  
  debug: {
    debugMode: getEnvBoolean('VITE_DEBUG_MODE', false),
    showQueryDevtools: getEnvBoolean('VITE_SHOW_QUERY_DEVTOOLS', false),
  },
};

// Export individual configurations for convenience
export const { supabase: supabaseConfig } = env;
export const { app: appConfig } = env;
export const { legal: legalConfig } = env;
export const { payments: paymentsConfig } = env;
export const { whatsapp: whatsappConfig } = env;
export const { email: emailConfig } = env;
export const { files: filesConfig } = env;
export const { debug: debugConfig } = env;

// Environment validation function
export function validateEnvironment(): void {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    if (env.app.environment === 'production') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
  
  // Log environment status in development
  if (env.debug.debugMode) {
    console.log('Environment configuration loaded:', {
      environment: env.app.environment,
      supabaseUrl: env.supabase.url,
      debugMode: env.debug.debugMode,
    });
  }
}

// Call validation on module load
validateEnvironment();