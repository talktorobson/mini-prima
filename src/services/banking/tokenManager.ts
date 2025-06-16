// 🔑 OAUTH 2.0 TOKEN MANAGER FOR BANKING INTEGRATION
// D'Avila Reis Legal Practice Management System
// Secure token management with automatic refresh and mTLS authentication

import { getBankingConfig, getSecurityConfig } from '../../config/banking';
import { CertificateManager } from './certificateManager';

// =====================================================
// TOKEN INTERFACES
// =====================================================

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: 'Bearer';
  scope: string;
}

export interface TokenRequest {
  grant_type: 'client_credentials' | 'refresh_token';
  scope?: string;
  refresh_token?: string;
}

export interface TokenStatus {
  isValid: boolean;
  expiresAt: Date | null;
  timeUntilExpiry: number; // seconds
  needsRefresh: boolean;
  scope: string[];
}

// =====================================================
// TOKEN MANAGER CLASS
// =====================================================

export class TokenManager {
  private config = getBankingConfig();
  private securityConfig = getSecurityConfig();
  private certificateManager: CertificateManager;
  
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiryTime: Date | null = null;
  private tokenScope: string[] = [];
  private lastTokenRequest: Date | null = null;
  
  // Token refresh settings
  private refreshBuffer = 60 * 1000; // Refresh 1 minute before expiry
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.certificateManager = new CertificateManager();
    this.logTokenManagerConfig();
  }

  // =====================================================
  // PUBLIC TOKEN MANAGEMENT API
  // =====================================================

  async getAccessToken(): Promise<string> {
    try {
      // Check if current token is valid
      if (this.isTokenValid()) {
        return this.accessToken!;
      }

      // Try to refresh token if we have a refresh token
      if (this.refreshToken && this.shouldUseRefreshToken()) {
        await this.refreshAccessToken();
        return this.accessToken!;
      }

      // Perform full authentication
      await this.authenticate();
      return this.accessToken!;

    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      throw new Error(`Token acquisition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTokenStatus(): Promise<TokenStatus> {
    const timeUntilExpiry = this.expiryTime 
      ? Math.max(0, Math.floor((this.expiryTime.getTime() - Date.now()) / 1000))
      : 0;

    return {
      isValid: this.isTokenValid(),
      expiresAt: this.expiryTime,
      timeUntilExpiry,
      needsRefresh: this.needsRefresh(),
      scope: [...this.tokenScope]
    };
  }

  async revokeToken(): Promise<void> {
    try {
      if (!this.accessToken) {
        return;
      }

      console.log('🔓 Revoking access token...');

      // In a real implementation, this would call the revocation endpoint
      if (!this.config.mockApi) {
        await this.makeTokenRequest('/oauth/revoke', {
          token: this.accessToken,
          token_type_hint: 'access_token'
        });
      }

      this.clearTokenData();
      console.log('✅ Token revoked successfully');

    } catch (error) {
      console.error('❌ Token revocation failed:', error);
      // Clear token data even if revocation failed
      this.clearTokenData();
      throw error;
    }
  }

  // =====================================================
  // AUTHENTICATION METHODS
  // =====================================================

  private async authenticate(): Promise<void> {
    try {
      console.log('🔐 Authenticating with Santander API...');

      const tokenRequest: TokenRequest = {
        grant_type: 'client_credentials',
        scope: this.getRequiredScopes().join(' ')
      };

      const tokenResponse = await this.requestToken(tokenRequest);
      this.setTokenData(tokenResponse);

      console.log('✅ Authentication successful');
      this.logTokenEvent('authentication_success', { scope: tokenResponse.scope });

    } catch (error) {
      console.error('❌ Authentication failed:', error);
      this.logTokenEvent('authentication_failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      console.log('🔄 Refreshing access token...');

      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const tokenRequest: TokenRequest = {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      };

      const tokenResponse = await this.requestToken(tokenRequest);
      this.setTokenData(tokenResponse);

      console.log('✅ Token refresh successful');
      this.logTokenEvent('token_refresh_success', { scope: tokenResponse.scope });

    } catch (error) {
      console.error('❌ Token refresh failed, attempting full authentication:', error);
      this.logTokenEvent('token_refresh_failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      // Clear refresh token and try full authentication
      this.refreshToken = null;
      await this.authenticate();
    }
  }

  // =====================================================
  // TOKEN REQUEST METHODS
  // =====================================================

  private async requestToken(tokenRequest: TokenRequest): Promise<TokenResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Token request attempt ${attempt}/${this.maxRetries}`);

        const response = await this.makeTokenRequest('/oauth/token', tokenRequest);
        
        // Validate token response
        this.validateTokenResponse(response);
        
        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.maxRetries) {
          console.warn(`⚠️ Token request attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private async makeTokenRequest(endpoint: string, data: any): Promise<TokenResponse> {
    if (this.config.mockApi) {
      return this.getMockTokenResponse();
    }

    try {
      // Get mTLS configuration
      const mtlsConfig = await this.certificateManager.ensureValidCertificates();
      
      // Prepare request headers
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': this.getBasicAuthHeader(),
        'User-Agent': 'D\'Avila-Reis-Legal-System/1.0',
        'x-fapi-auth-date': new Date().toISOString(),
        'x-fapi-customer-ip-address': this.getClientIP(),
        'x-fapi-interaction-id': this.generateInteractionId()
      };

      // Convert data to form-encoded string
      const formData = this.encodeFormData(data);

      // In a real implementation, this would make an actual HTTPS request
      // with mTLS configuration to Santander's token endpoint
      console.log(`Making token request to: ${this.config.baseURL}${endpoint}`);
      console.log('Headers:', headers);
      console.log('Data:', formData);

      // Simulate network delay
      await this.delay(500);

      // Return mock response for development
      return this.getMockTokenResponse();

    } catch (error) {
      throw new Error(`Token request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================================
  // TOKEN VALIDATION & UTILITIES
  // =====================================================

  private isTokenValid(): boolean {
    if (!this.accessToken || !this.expiryTime) {
      return false;
    }

    const now = Date.now();
    const expiryWithBuffer = this.expiryTime.getTime() - this.refreshBuffer;
    
    return now < expiryWithBuffer;
  }

  private needsRefresh(): boolean {
    if (!this.accessToken || !this.expiryTime) {
      return true;
    }

    const now = Date.now();
    const timeUntilExpiry = this.expiryTime.getTime() - now;
    
    return timeUntilExpiry <= this.refreshBuffer;
  }

  private shouldUseRefreshToken(): boolean {
    return this.refreshToken !== null && this.lastTokenRequest !== null;
  }

  private validateTokenResponse(response: TokenResponse): void {
    if (!response.access_token) {
      throw new Error('Invalid token response: missing access_token');
    }

    if (!response.token_type || response.token_type !== 'Bearer') {
      throw new Error('Invalid token response: unsupported token_type');
    }

    if (!response.expires_in || response.expires_in <= 0) {
      throw new Error('Invalid token response: invalid expires_in');
    }

    if (!response.scope) {
      throw new Error('Invalid token response: missing scope');
    }
  }

  private setTokenData(tokenResponse: TokenResponse): void {
    this.accessToken = tokenResponse.access_token;
    this.refreshToken = tokenResponse.refresh_token || null;
    this.expiryTime = new Date(Date.now() + (tokenResponse.expires_in - 60) * 1000); // 1 minute buffer
    this.tokenScope = tokenResponse.scope.split(' ');
    this.lastTokenRequest = new Date();

    if (this.config.debugMode) {
      console.log('🔑 Token data updated:', {
        hasAccessToken: !!this.accessToken,
        hasRefreshToken: !!this.refreshToken,
        expiresAt: this.expiryTime?.toISOString(),
        scope: this.tokenScope
      });
    }
  }

  private clearTokenData(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiryTime = null;
    this.tokenScope = [];
    this.lastTokenRequest = null;

    console.log('🗑️ Token data cleared');
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private getRequiredScopes(): string[] {
    return [
      'pix.read',
      'pix.write',
      'accounts.read',
      'payments.write',
      'openbanking.read'
    ];
  }

  private getBasicAuthHeader(): string {
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
    return `Basic ${btoa(credentials)}`;
  }

  private encodeFormData(data: any): string {
    return Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
  }

  private getClientIP(): string {
    // In a real implementation, get the actual client IP
    return '192.168.1.1';
  }

  private generateInteractionId(): string {
    return crypto.randomUUID();
  }

  private getMockTokenResponse(): TokenResponse {
    const scopes = this.getRequiredScopes();
    
    return {
      access_token: `mock_access_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refresh_token: `mock_refresh_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expires_in: 3600, // 1 hour
      token_type: 'Bearer',
      scope: scopes.join(' ')
    };
  }

  private logTokenManagerConfig(): void {
    if (this.config.debugMode) {
      console.log('🔑 Token Manager Configuration:');
      console.log(`  Client ID: ${this.config.clientId ? '✓ SET' : '✗ MISSING'}`);
      console.log(`  Client Secret: ${this.config.clientSecret ? '✓ SET' : '✗ MISSING'}`);
      console.log(`  Environment: ${this.config.environment}`);
      console.log(`  Mock API: ${this.config.mockApi}`);
      console.log(`  Required Scopes: ${this.getRequiredScopes().join(', ')}`);
    }
  }

  private logTokenEvent(event: string, details: any): void {
    if (this.config.debugMode) {
      console.log(`🔑 Token Event: ${event}`, details);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =====================================================
  // ADVANCED TOKEN MANAGEMENT
  // =====================================================

  async preemptiveRefresh(): Promise<void> {
    try {
      if (this.needsRefresh() && this.refreshToken) {
        console.log('🔄 Performing preemptive token refresh...');
        await this.refreshAccessToken();
      }
    } catch (error) {
      console.warn('⚠️ Preemptive refresh failed:', error);
      // Don't throw error for preemptive refresh failures
    }
  }

  async ensureValidToken(): Promise<string> {
    // Perform preemptive refresh if needed
    await this.preemptiveRefresh();
    
    // Get valid token
    return await this.getAccessToken();
  }

  hasValidToken(): boolean {
    return this.isTokenValid();
  }

  getTokenExpiryTime(): Date | null {
    return this.expiryTime;
  }

  getTokenScope(): string[] {
    return [...this.tokenScope];
  }

  // =====================================================
  // RATE LIMITING SUPPORT
  // =====================================================

  private rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(operation: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = this.securityConfig.rateLimit;

    const tracker = this.rateLimitTracker.get(operation);
    
    if (!tracker || now >= tracker.resetTime) {
      this.rateLimitTracker.set(operation, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (tracker.count >= maxRequests) {
      return false;
    }

    tracker.count++;
    return true;
  }

  getRemainingRequests(operation: string): number {
    const tracker = this.rateLimitTracker.get(operation);
    if (!tracker || Date.now() >= tracker.resetTime) {
      return this.securityConfig.rateLimit;
    }
    return Math.max(0, this.securityConfig.rateLimit - tracker.count);
  }
}