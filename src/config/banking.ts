// 🏦 BANKING INTEGRATION CONFIGURATION
// D'Avila Reis Legal Practice Management System
// Environment-based configuration for Santander Banking API

interface BankingEnvironmentConfig {
  baseURL: string;
  clientId: string;
  clientSecret: string;
  certificatePath: string;
  privateKeyPath: string;
  caPath: string;
  passphrase: string;
  environment: 'sandbox' | 'production';
  mockApi: boolean;
  debugMode: boolean;
}

interface PixConfig {
  key: string;
  defaultExpiration: number;
  webhookUrl: string;
  webhookSecret: string;
}

interface SecurityConfig {
  encryptionKey: string;
  salt: string;
  rateLimit: number;
  timeout: number;
}

// =====================================================
// ENVIRONMENT CONFIGURATION
// =====================================================

export function getBankingConfig(): BankingEnvironmentConfig {
  const environment = (import.meta.env.SANTANDER_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
  
  const baseConfig = {
    clientId: import.meta.env.SANTANDER_CLIENT_ID || '',
    clientSecret: import.meta.env.SANTANDER_CLIENT_SECRET || '',
    certificatePath: import.meta.env.SANTANDER_CERT_PATH || './certs/santander-client.crt',
    privateKeyPath: import.meta.env.SANTANDER_KEY_PATH || './certs/santander-client.key',
    caPath: import.meta.env.SANTANDER_CA_PATH || './certs/santander-ca.crt',
    passphrase: import.meta.env.SANTANDER_CERT_PASSPHRASE || '',
    environment,
    mockApi: import.meta.env.MOCK_BANKING_API === 'true' || environment === 'sandbox',
    debugMode: import.meta.env.DEBUG_BANKING === 'true' || false
  };

  if (environment === 'sandbox') {
    return {
      ...baseConfig,
      baseURL: import.meta.env.SANTANDER_SANDBOX_URL || 'https://trust-open-api.santander.com.br/sandbox'
    };
  } else {
    return {
      ...baseConfig,
      baseURL: import.meta.env.SANTANDER_PRODUCTION_URL || 'https://trust-open-api.santander.com.br/prod'
    };
  }
}

export function getPixConfig(): PixConfig {
  return {
    key: import.meta.env.PIX_KEY || '',
    defaultExpiration: Number(import.meta.env.PIX_DEFAULT_EXPIRATION) || 3600,
    webhookUrl: import.meta.env.PIX_WEBHOOK_URL || '',
    webhookSecret: import.meta.env.PIX_WEBHOOK_SECRET || ''
  };
}

export function getSecurityConfig(): SecurityConfig {
  return {
    encryptionKey: import.meta.env.BANKING_ENCRYPTION_KEY || '',
    salt: import.meta.env.BANKING_SALT || '',
    rateLimit: Number(import.meta.env.API_RATE_LIMIT) || 100,
    timeout: Number(import.meta.env.API_TIMEOUT) || 30000
  };
}

// =====================================================
// CONFIGURATION VALIDATION
// =====================================================

export function validateBankingConfig(): { isValid: boolean; errors: string[] } {
  const config = getBankingConfig();
  const pixConfig = getPixConfig();
  const securityConfig = getSecurityConfig();
  const errors: string[] = [];

  // Required configuration validation
  if (!config.clientId) {
    errors.push('SANTANDER_CLIENT_ID is required');
  }

  if (!config.clientSecret) {
    errors.push('SANTANDER_CLIENT_SECRET is required');
  }

  if (!config.passphrase && !config.mockApi) {
    errors.push('SANTANDER_CERT_PASSPHRASE is required for production');
  }

  if (!pixConfig.key && !config.mockApi) {
    errors.push('PIX_KEY is required for PIX integration');
  }

  if (!pixConfig.webhookUrl && !config.mockApi) {
    errors.push('PIX_WEBHOOK_URL is required for webhook handling');
  }

  if (!pixConfig.webhookSecret && !config.mockApi) {
    errors.push('PIX_WEBHOOK_SECRET is required for webhook security');
  }

  if (!securityConfig.encryptionKey && !config.mockApi) {
    errors.push('BANKING_ENCRYPTION_KEY is required for data encryption');
  }

  // Production-specific validations
  if (config.environment === 'production') {
    if (config.mockApi) {
      errors.push('MOCK_BANKING_API should be false in production');
    }

    if (!securityConfig.encryptionKey || securityConfig.encryptionKey.length < 32) {
      errors.push('BANKING_ENCRYPTION_KEY must be at least 32 characters in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// =====================================================
// CONFIGURATION LOGGING
// =====================================================

export function logConfigurationStatus(): void {
  const config = getBankingConfig();
  const validation = validateBankingConfig();

  console.log('🏦 BANKING INTEGRATION CONFIGURATION');
  console.log('═'.repeat(50));
  console.log(`Environment: ${config.environment}`);
  console.log(`Base URL: ${config.baseURL}`);
  console.log(`Mock API: ${config.mockApi ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Debug Mode: ${config.debugMode ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Client ID: ${config.clientId ? '✓ SET' : '✗ MISSING'}`);
  console.log(`Client Secret: ${config.clientSecret ? '✓ SET' : '✗ MISSING'}`);
  console.log(`Certificate Path: ${config.certificatePath}`);
  console.log(`Private Key Path: ${config.privateKeyPath}`);
  console.log(`CA Path: ${config.caPath}`);
  
  if (validation.isValid) {
    console.log('\n✅ Configuration is valid and ready for use');
  } else {
    console.log('\n❌ Configuration validation failed:');
    validation.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('═'.repeat(50));
}

// =====================================================
// EXPORT DEFAULT CONFIGURATIONS
// =====================================================

export const defaultBankingConfig = getBankingConfig();
export const defaultPixConfig = getPixConfig();
export const defaultSecurityConfig = getSecurityConfig();

// Environment check warning
if (typeof window !== 'undefined' && defaultBankingConfig.environment === 'production' && defaultBankingConfig.debugMode) {
  console.warn('⚠️ WARNING: Debug mode is enabled in production environment');
}

// Export configuration status for monitoring
export const configurationStatus = {
  isConfigured: validateBankingConfig().isValid,
  environment: defaultBankingConfig.environment,
  mockApi: defaultBankingConfig.mockApi,
  debugMode: defaultBankingConfig.debugMode,
  timestamp: new Date().toISOString()
};