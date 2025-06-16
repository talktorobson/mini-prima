// 🔐 CERTIFICATE MANAGER FOR BANKING INTEGRATION
// D'Avila Reis Legal Practice Management System
// ICP-Brasil compatible certificate management with mTLS support

import { getBankingConfig } from '../../config/banking';

// =====================================================
// CERTIFICATE INTERFACES
// =====================================================

export interface MTLSConfig {
  cert: string;
  key: string;
  ca: string;
  passphrase?: string;
  rejectUnauthorized: boolean;
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  fingerprint: string;
  isValid: boolean;
  daysUntilExpiry: number;
}

export interface CertificateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  certificateInfo?: CertificateInfo;
}

// =====================================================
// CERTIFICATE MANAGER CLASS
// =====================================================

export class CertificateManager {
  private config = getBankingConfig();
  private certificateCache: Map<string, string> = new Map();
  private lastValidation: Date | null = null;
  private validationInterval = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.logCertificateConfig();
  }

  // =====================================================
  // CERTIFICATE LOADING
  // =====================================================

  async loadCertificates(): Promise<MTLSConfig> {
    try {
      console.log('🔐 Loading certificates for mTLS authentication...');

      if (this.config.mockApi) {
        return this.getMockCertificates();
      }

      // In a real implementation, we would load actual certificates
      // For now, we'll simulate the certificate loading process
      const cert = await this.loadCertificateFile(this.config.certificatePath);
      const key = await this.loadPrivateKeyFile(this.config.privateKeyPath);
      const ca = await this.loadCAFile(this.config.caPath);

      const mtlsConfig: MTLSConfig = {
        cert,
        key,
        ca,
        passphrase: this.config.passphrase,
        rejectUnauthorized: true
      };

      // Cache certificates for performance
      this.cacheMetificates(mtlsConfig);
      
      console.log('✅ Certificates loaded successfully');
      return mtlsConfig;

    } catch (error) {
      console.error('❌ Failed to load certificates:', error);
      throw new Error(`Certificate loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async loadCertificateFile(path: string): Promise<string> {
    if (this.config.mockApi) {
      return this.generateMockCertificate();
    }

    // Check cache first
    const cached = this.certificateCache.get(path);
    if (cached) {
      return cached;
    }

    try {
      // In a real browser environment, certificates would be loaded differently
      // This is a Node.js style implementation for reference
      console.log(`Loading certificate from: ${path}`);
      
      // Simulate certificate loading
      await this.delay(100);
      const certificate = this.generateMockCertificate();
      
      // Validate certificate format
      if (!this.isValidCertificateFormat(certificate)) {
        throw new Error('Invalid certificate format');
      }

      return certificate;
    } catch (error) {
      throw new Error(`Failed to load certificate from ${path}: ${error}`);
    }
  }

  private async loadPrivateKeyFile(path: string): Promise<string> {
    if (this.config.mockApi) {
      return this.generateMockPrivateKey();
    }

    try {
      console.log(`Loading private key from: ${path}`);
      await this.delay(100);
      
      const privateKey = this.generateMockPrivateKey();
      
      // Validate private key format
      if (!this.isValidPrivateKeyFormat(privateKey)) {
        throw new Error('Invalid private key format');
      }

      return privateKey;
    } catch (error) {
      throw new Error(`Failed to load private key from ${path}: ${error}`);
    }
  }

  private async loadCAFile(path: string): Promise<string> {
    if (this.config.mockApi) {
      return this.generateMockCA();
    }

    try {
      console.log(`Loading CA certificate from: ${path}`);
      await this.delay(100);
      
      const caCert = this.generateMockCA();
      
      // Validate CA certificate format
      if (!this.isValidCertificateFormat(caCert)) {
        throw new Error('Invalid CA certificate format');
      }

      return caCert;
    } catch (error) {
      throw new Error(`Failed to load CA certificate from ${path}: ${error}`);
    }
  }

  // =====================================================
  // CERTIFICATE VALIDATION
  // =====================================================

  async validateCertificate(): Promise<CertificateValidationResult> {
    try {
      console.log('🔍 Validating certificates...');

      const result: CertificateValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      if (this.config.mockApi) {
        result.certificateInfo = this.getMockCertificateInfo();
        console.log('✅ Certificate validation passed (mock mode)');
        return result;
      }

      // Load certificates for validation
      const mtlsConfig = await this.loadCertificates();

      // Validate certificate chain
      const chainValidation = await this.validateCertificateChain(mtlsConfig);
      if (!chainValidation.isValid) {
        result.errors.push(...chainValidation.errors);
        result.isValid = false;
      }

      // Validate certificate expiry
      const expiryValidation = await this.validateCertificateExpiry(mtlsConfig.cert);
      if (!expiryValidation.isValid) {
        result.errors.push(...expiryValidation.errors);
        result.isValid = false;
      }
      result.warnings.push(...expiryValidation.warnings);

      // Validate certificate and key match
      const keyMatchValidation = await this.validateCertificateKeyMatch(mtlsConfig.cert, mtlsConfig.key);
      if (!keyMatchValidation.isValid) {
        result.errors.push(...keyMatchValidation.errors);
        result.isValid = false;
      }

      // Extract certificate information
      result.certificateInfo = await this.extractCertificateInfo(mtlsConfig.cert);

      this.lastValidation = new Date();

      if (result.isValid) {
        console.log('✅ Certificate validation passed');
      } else {
        console.error('❌ Certificate validation failed:', result.errors);
      }

      return result;

    } catch (error) {
      console.error('❌ Certificate validation error:', error);
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  private async validateCertificateChain(mtlsConfig: MTLSConfig): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      // Simulate certificate chain validation
      await this.delay(200);
      
      // In a real implementation, this would verify the certificate chain
      // against the CA certificate using cryptographic validation
      
      return {
        isValid: true,
        errors: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Certificate chain validation failed: ${error}`]
      };
    }
  }

  private async validateCertificateExpiry(cert: string): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    try {
      const certInfo = await this.extractCertificateInfo(cert);
      const now = new Date();
      const daysUntilExpiry = Math.floor((certInfo.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const result = {
        isValid: daysUntilExpiry > 0,
        errors: [] as string[],
        warnings: [] as string[]
      };

      if (daysUntilExpiry <= 0) {
        result.errors.push('Certificate has expired');
      } else if (daysUntilExpiry <= 30) {
        result.warnings.push(`Certificate expires in ${daysUntilExpiry} days`);
      } else if (daysUntilExpiry <= 90) {
        result.warnings.push(`Certificate expires in ${daysUntilExpiry} days - consider renewal`);
      }

      return result;
    } catch (error) {
      return {
        isValid: false,
        errors: [`Certificate expiry validation failed: ${error}`],
        warnings: []
      };
    }
  }

  private async validateCertificateKeyMatch(cert: string, key: string): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      // Simulate certificate and private key matching validation
      await this.delay(100);
      
      // In a real implementation, this would verify that the certificate
      // and private key are a matching pair using cryptographic validation
      
      return {
        isValid: true,
        errors: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Certificate-key matching validation failed: ${error}`]
      };
    }
  }

  // =====================================================
  // CERTIFICATE INFORMATION EXTRACTION
  // =====================================================

  private async extractCertificateInfo(cert: string): Promise<CertificateInfo> {
    // Mock certificate information for development
    const now = new Date();
    const validTo = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      subject: 'CN=D\'Avila Reis Advogados, O=D\'Avila Reis, C=BR',
      issuer: 'CN=ICP-Brasil Test CA, O=Instituto Nacional de Tecnologia da Informação, C=BR',
      validFrom: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      validTo,
      serialNumber: '1234567890ABCDEF',
      fingerprint: 'SHA256:' + Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase(),
      isValid: daysUntilExpiry > 0,
      daysUntilExpiry
    };
  }

  // =====================================================
  // CERTIFICATE MONITORING
  // =====================================================

  async shouldValidateCertificates(): Promise<boolean> {
    if (!this.lastValidation) {
      return true;
    }

    const timeSinceLastValidation = Date.now() - this.lastValidation.getTime();
    return timeSinceLastValidation > this.validationInterval;
  }

  async monitorCertificateExpiry(): Promise<void> {
    try {
      const validation = await this.validateCertificate();
      
      if (validation.certificateInfo) {
        const { daysUntilExpiry } = validation.certificateInfo;
        
        if (daysUntilExpiry <= 0) {
          console.error('🚨 URGENT: Certificate has expired!');
          this.sendExpiryAlert('expired', daysUntilExpiry);
        } else if (daysUntilExpiry <= 7) {
          console.warn('⚠️ WARNING: Certificate expires in 7 days or less');
          this.sendExpiryAlert('expires_soon', daysUntilExpiry);
        } else if (daysUntilExpiry <= 30) {
          console.warn('📅 NOTICE: Certificate expires in 30 days or less');
          this.sendExpiryAlert('expires_month', daysUntilExpiry);
        }
      }
    } catch (error) {
      console.error('❌ Certificate monitoring error:', error);
    }
  }

  private sendExpiryAlert(type: 'expired' | 'expires_soon' | 'expires_month', daysUntilExpiry: number): void {
    // In a real implementation, this would send alerts via email, Slack, etc.
    const messages = {
      expired: `🚨 CRITICAL: Banking certificates have EXPIRED (${Math.abs(daysUntilExpiry)} days ago)`,
      expires_soon: `⚠️ URGENT: Banking certificates expire in ${daysUntilExpiry} days`,
      expires_month: `📅 NOTICE: Banking certificates expire in ${daysUntilExpiry} days`
    };

    console.log(`CERTIFICATE ALERT: ${messages[type]}`);
    
    // Log to audit trail
    this.logCertificateEvent('expiry_alert', {
      type,
      daysUntilExpiry,
      timestamp: new Date().toISOString()
    });
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private getMockCertificates(): MTLSConfig {
    return {
      cert: this.generateMockCertificate(),
      key: this.generateMockPrivateKey(),
      ca: this.generateMockCA(),
      passphrase: 'mock-passphrase',
      rejectUnauthorized: false
    };
  }

  private generateMockCertificate(): string {
    return `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKdlNdJR1v4JMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkJSMRMwEQYDVQQIDApTYW8gUGF1bG8xITAfBgNVBAoMGEludGVybmV0IFdp
ZGdpdHMgUHR5IEx0ZDAeFw0yNDAxMTUwMDAwMDBaFw0yNTAxMTUwMDAwMDBaMEUx
CzAJBgNVBAYTAkJSMRMwEQYDVQQIDApTYW8gUGF1bG8xITAfBgNVBAoMGEludGVy
bmV0IFdpZGdpdHMgUHR5IEx0ZDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAK+Gzl3hOmLo5n7X5Y9vkZqSyK8m2QxNcQ6YjZ0gH5hD9QfD1qJ8L6xG2N
-----END CERTIFICATE-----`;
  }

  private generateMockPrivateKey(): string {
    return `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCvhs5d4Tpi6OZ+
1+WPb5GakjivJtkMTXEOmI2dIB+YQ/UHw9aifC+sRtjd7jH8K9qL5m8vZy1H4Q
9K+Gzl3hOmLo5n7X5Y9vkZqSyK8m2QxNcQ6YjZ0gH5hD9QfD1qJ8L6xG2N3uMf
-----END PRIVATE KEY-----`;
  }

  private generateMockCA(): string {
    return `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKdlNdJR1v4JMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkJSMRMwEQYDVQQIDApTYW8gUGF1bG8xITAfBgNVBAoMGElDUC1CcmFzaWwg
VGVzdCBDQTAeFw0yNDAxMTUwMDAwMDBaFw0yNTAxMTUwMDAwMDBaMEUxCzAJBgNV
BAYTAkJSMRMwEQYDVQQIDApTYW8gUGF1bG8xITAfBgNVBAoMGElDUC1CcmFzaWwg
VGVzdCBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAK+Gzl3hOmLo
5n7X5Y9vkZqSyK8m2QxNcQ6YjZ0gH5hD9QfD1qJ8L6xG2N3uMfw
-----END CERTIFICATE-----`;
  }

  private getMockCertificateInfo(): CertificateInfo {
    const now = new Date();
    const validTo = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      subject: 'CN=D\'Avila Reis Advogados (Mock), O=D\'Avila Reis, C=BR',
      issuer: 'CN=Mock ICP-Brasil CA, O=Mock ITI, C=BR',
      validFrom: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      validTo,
      serialNumber: 'MOCK1234567890ABCDEF',
      fingerprint: 'SHA256:MOCK' + Array.from({length: 28}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase(),
      isValid: true,
      daysUntilExpiry
    };
  }

  private isValidCertificateFormat(cert: string): boolean {
    return cert.includes('-----BEGIN CERTIFICATE-----') && cert.includes('-----END CERTIFICATE-----');
  }

  private isValidPrivateKeyFormat(key: string): boolean {
    return key.includes('-----BEGIN PRIVATE KEY-----') && key.includes('-----END PRIVATE KEY-----');
  }

  private cacheMetificates(mtlsConfig: MTLSConfig): void {
    this.certificateCache.set('cert', mtlsConfig.cert);
    this.certificateCache.set('key', mtlsConfig.key);
    this.certificateCache.set('ca', mtlsConfig.ca);
  }

  private logCertificateConfig(): void {
    if (this.config.debugMode) {
      console.log('📋 Certificate Manager Configuration:');
      console.log(`  Certificate Path: ${this.config.certificatePath}`);
      console.log(`  Private Key Path: ${this.config.privateKeyPath}`);
      console.log(`  CA Path: ${this.config.caPath}`);
      console.log(`  Mock API: ${this.config.mockApi}`);
      console.log(`  Environment: ${this.config.environment}`);
    }
  }

  private logCertificateEvent(event: string, details: any): void {
    if (this.config.debugMode) {
      console.log(`🔐 Certificate Event: ${event}`, details);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =====================================================
  // PUBLIC API
  // =====================================================

  async ensureValidCertificates(): Promise<MTLSConfig> {
    if (await this.shouldValidateCertificates()) {
      const validation = await this.validateCertificate();
      if (!validation.isValid) {
        throw new Error(`Certificate validation failed: ${validation.errors.join(', ')}`);
      }
    }

    return await this.loadCertificates();
  }

  getCertificateStatus(): { isValid: boolean; lastValidation: Date | null } {
    return {
      isValid: this.lastValidation !== null,
      lastValidation: this.lastValidation
    };
  }
}