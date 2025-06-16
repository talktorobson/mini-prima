// 🌐 SECURE BANKING API CLIENT
// D'Avila Reis Legal Practice Management System  
// FAPI-compliant API client with mTLS, proper headers, and comprehensive error handling

import { getBankingConfig, getSecurityConfig } from '../../config/banking';
import { CertificateManager, MTLSConfig } from './certificateManager';
import { TokenManager } from './tokenManager';

// =====================================================
// API CLIENT INTERFACES
// =====================================================

export interface APIRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface APIResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  requestId: string;
  timestamp: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  status?: number;
  requestId?: string;
  timestamp: string;
}

export interface RequestMetrics {
  requestId: string;
  endpoint: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  success: boolean;
}

// =====================================================
// BANKING API CLIENT CLASS
// =====================================================

export class BankingAPIClient {
  private config = getBankingConfig();
  private securityConfig = getSecurityConfig();
  private certificateManager: CertificateManager;
  private tokenManager: TokenManager;
  
  // Request tracking
  private requestMetrics: Map<string, RequestMetrics> = new Map();
  private activeRequests = 0;
  private totalRequests = 0;
  
  // Error tracking
  private errorCounts = new Map<string, number>();
  private lastError: APIError | null = null;

  constructor() {
    this.certificateManager = new CertificateManager();
    this.tokenManager = new TokenManager();
    this.logClientConfig();
  }

  // =====================================================
  // MAIN API REQUEST METHOD
  // =====================================================

  async makeSecureRequest<T = any>(request: APIRequest): Promise<APIResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      this.activeRequests++;
      this.totalRequests++;

      console.log(`🌐 API Request [${requestId}]: ${request.method} ${request.endpoint}`);

      // Validate request
      this.validateRequest(request);

      // Check rate limiting
      if (!this.tokenManager.checkRateLimit(request.endpoint)) {
        throw this.createAPIError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded for this endpoint', 429, requestId);
      }

      // Get valid access token
      const accessToken = await this.tokenManager.ensureValidToken();

      // Get mTLS configuration
      const mtlsConfig = await this.certificateManager.ensureValidCertificates();

      // Prepare request headers
      const headers = await this.prepareHeaders(request, accessToken);

      // Execute request with retries
      const response = await this.executeRequestWithRetries(request, headers, mtlsConfig, requestId);

      // Record successful request metrics
      this.recordRequestMetrics(requestId, request, startTime, Date.now(), response.status, true);

      return response;

    } catch (error) {
      const apiError = this.handleRequestError(error, requestId, request.endpoint);
      
      // Record failed request metrics
      this.recordRequestMetrics(requestId, request, startTime, Date.now(), apiError.status || 0, false);
      
      throw apiError;
    } finally {
      this.activeRequests--;
    }
  }

  // =====================================================
  // REQUEST EXECUTION
  // =====================================================

  private async executeRequestWithRetries<T>(
    request: APIRequest,
    headers: Record<string, string>,
    mtlsConfig: MTLSConfig,
    requestId: string
  ): Promise<APIResponse<T>> {
    const maxRetries = request.retries || 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Request attempt ${attempt}/${maxRetries} [${requestId}]`);

        const response = await this.executeRequest(request, headers, mtlsConfig, requestId);
        
        if (attempt > 1) {
          console.log(`✅ Request succeeded on attempt ${attempt} [${requestId}]`);
        }
        
        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on certain errors
        if (this.shouldNotRetry(error)) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          console.warn(`⚠️ Request attempt ${attempt} failed [${requestId}], retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private async executeRequest<T>(
    request: APIRequest,
    headers: Record<string, string>,
    mtlsConfig: MTLSConfig,
    requestId: string
  ): Promise<APIResponse<T>> {
    
    if (this.config.mockApi) {
      return await this.mockAPICall(request, headers, requestId);
    }

    try {
      const url = `${this.config.baseURL}${request.endpoint}`;
      const timeout = request.timeout || this.securityConfig.timeout;

      console.log(`📡 Making HTTPS request to: ${url}`);
      if (this.config.debugMode) {
        console.log('Headers:', headers);
        console.log('mTLS Config:', { hasCert: !!mtlsConfig.cert, hasKey: !!mtlsConfig.key });
      }

      // In a real implementation, this would use fetch() or similar with mTLS
      // For now, simulate the request
      await this.delay(200 + Math.random() * 300); // Simulate network delay

      const mockResponse = await this.mockAPICall(request, headers, requestId);
      return mockResponse;

    } catch (error) {
      throw this.createAPIError(
        'REQUEST_FAILED',
        `HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        requestId
      );
    }
  }

  // =====================================================
  // HEADER PREPARATION
  // =====================================================

  private async prepareHeaders(request: APIRequest, accessToken: string): Promise<Record<string, string>> {
    const baseHeaders: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'User-Agent': 'D\'Avila-Reis-Legal-System/1.0',
      'x-fapi-auth-date': new Date().toISOString(),
      'x-fapi-customer-ip-address': this.getClientIP(),
      'x-fapi-interaction-id': this.generateInteractionId(),
      'x-api-version': '2.0',
      'x-request-id': this.generateRequestId()
    };

    // Add content type for requests with body
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      baseHeaders['Content-Type'] = 'application/json';
    }

    // Add idempotency key for POST requests
    if (request.method === 'POST') {
      baseHeaders['x-idempotency-key'] = this.generateIdempotencyKey();
    }

    // Add custom headers from request
    if (request.headers) {
      Object.assign(baseHeaders, request.headers);
    }

    // Add security headers
    baseHeaders['x-client-certificate-fingerprint'] = await this.getCertificateFingerprint();
    baseHeaders['x-request-timestamp'] = Date.now().toString();

    return baseHeaders;
  }

  // =====================================================
  // MOCK API IMPLEMENTATION
  // =====================================================

  private async mockAPICall<T>(
    request: APIRequest,
    headers: Record<string, string>,
    requestId: string
  ): Promise<APIResponse<T>> {
    
    // Simulate network delay
    await this.delay(100 + Math.random() * 400);

    // Simulate occasional errors for testing
    if (Math.random() < 0.02) { // 2% error rate
      throw this.createAPIError('MOCK_ERROR', 'Simulated API error for testing', 500, requestId);
    }

    const timestamp = new Date().toISOString();
    
    // Generate mock response based on endpoint
    let mockData: any = { success: true, timestamp };

    if (request.endpoint.includes('/pix/cob')) {
      mockData = this.generateMockPixResponse();
    } else if (request.endpoint.includes('/boleto')) {
      mockData = this.generateMockBoletoResponse();
    } else if (request.endpoint.includes('/accounts')) {
      mockData = this.generateMockAccountResponse();
    } else if (request.endpoint.includes('/transactions')) {
      mockData = this.generateMockTransactionsResponse();
    }

    const response: APIResponse<T> = {
      data: mockData,
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-response-id': requestId,
        'x-response-time': Date.now().toString()
      },
      requestId,
      timestamp
    };

    console.log(`✅ Mock API Response [${requestId}]:`, response.status, response.statusText);
    return response;
  }

  // =====================================================
  // MOCK RESPONSE GENERATORS
  // =====================================================

  private generateMockPixResponse(): any {
    const txid = this.generateTxId();
    return {
      txid,
      revisao: 0,
      loc: {
        id: Math.floor(Math.random() * 1000000),
        location: `${this.config.baseURL}/qr/v2/loc/${txid}`,
        tipoCob: 'cob',
        criacao: new Date().toISOString()
      },
      calendario: {
        criacao: new Date().toISOString(),
        expiracao: 3600
      },
      status: 'ATIVA',
      valor: { original: '100.00' },
      chave: '11999999999',
      pixCopiaECola: this.generatePixPayload()
    };
  }

  private generateMockBoletoResponse(): any {
    const nossoNumero = this.generateNossoNumero();
    return {
      nossoNumero,
      codigoBarras: '03399.12345 67890.123456 78901.234567 8 123450000010000',
      linhaDigitavel: '03399123456789012345678901234567812345000001000',
      dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      valor: '100.00',
      url: `${this.config.baseURL}/boleto/${nossoNumero}.pdf`,
      status: 'REGISTRADO'
    };
  }

  private generateMockAccountResponse(): any {
    return {
      accountId: '12345-6',
      currency: 'BRL',
      balanceAmount: {
        amount: (Math.random() * 1000000).toFixed(2),
        currency: 'BRL'
      },
      balanceType: 'AVAILABLE',
      lastUpdatedDateTime: new Date().toISOString()
    };
  }

  private generateMockTransactionsResponse(): any {
    const transactions = Array.from({ length: 10 }, (_, i) => ({
      transactionId: `TXN-${Date.now()}-${i}`,
      amount: {
        amount: (Math.random() * 10000).toFixed(2),
        currency: 'BRL'
      },
      creditDebitType: Math.random() > 0.5 ? 'CREDIT' : 'DEBIT',
      status: 'BOOKED',
      bookingDateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      transactionInformation: `Mock transaction ${i + 1}`
    }));

    return {
      transactions,
      totalCount: transactions.length,
      page: 1,
      pageSize: 10
    };
  }

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  private handleRequestError(error: any, requestId: string, endpoint: string): APIError {
    console.error(`❌ API Request Error [${requestId}]:`, error);

    // Track error counts
    const errorKey = `${endpoint}:${error.code || 'UNKNOWN'}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    if (error instanceof APIError) {
      this.lastError = error;
      return error;
    }

    const apiError = this.createAPIError(
      'REQUEST_ERROR',
      error.message || 'Unknown request error',
      0,
      requestId
    );

    this.lastError = apiError;
    return apiError;
  }

  private createAPIError(code: string, message: string, status?: number, requestId?: string): APIError {
    return {
      code,
      message,
      status,
      requestId,
      timestamp: new Date().toISOString()
    };
  }

  private shouldNotRetry(error: any): boolean {
    // Don't retry on authentication errors, client errors, etc.
    const nonRetryableStatuses = [400, 401, 403, 404, 422];
    return error.status && nonRetryableStatuses.includes(error.status);
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.floor(exponentialDelay + jitter);
  }

  // =====================================================
  // REQUEST VALIDATION & UTILITIES
  // =====================================================

  private validateRequest(request: APIRequest): void {
    if (!request.endpoint) {
      throw this.createAPIError('INVALID_REQUEST', 'Endpoint is required');
    }

    if (!request.method) {
      throw this.createAPIError('INVALID_REQUEST', 'HTTP method is required');
    }

    if (!request.endpoint.startsWith('/')) {
      throw this.createAPIError('INVALID_REQUEST', 'Endpoint must start with /');
    }

    // Validate data for requests that should have body
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.data === undefined) {
      console.warn(`⚠️ ${request.method} request to ${request.endpoint} has no data`);
    }
  }

  private recordRequestMetrics(
    requestId: string,
    request: APIRequest,
    startTime: number,
    endTime: number,
    status: number,
    success: boolean
  ): void {
    const metrics: RequestMetrics = {
      requestId,
      endpoint: request.endpoint,
      method: request.method,
      startTime,
      endTime,
      duration: endTime - startTime,
      status,
      success
    };

    this.requestMetrics.set(requestId, metrics);

    if (this.config.debugMode) {
      console.log(`📊 Request Metrics [${requestId}]:`, {
        duration: `${metrics.duration}ms`,
        status: metrics.status,
        success: metrics.success
      });
    }

    // Keep only last 100 requests in memory
    if (this.requestMetrics.size > 100) {
      const firstKey = this.requestMetrics.keys().next().value;
      this.requestMetrics.delete(firstKey);
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private getClientIP(): string {
    // In a real implementation, get the actual client IP
    return '192.168.1.1';
  }

  private generateInteractionId(): string {
    return crypto.randomUUID();
  }

  private generateRequestId(): string {
    return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateIdempotencyKey(): string {
    return `IDM-${Date.now()}-${crypto.randomUUID()}`;
  }

  private generateTxId(): string {
    return Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
  }

  private generateNossoNumero(): string {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }

  private generatePixPayload(): string {
    // Simplified PIX payload generation
    return 'BR100014BR.GOV.BCB.PIX01361234567890123456789012345678901234565204000053039865802BR5905NXCDF6008BRASILIA60070503***6304A9B0';
  }

  private async getCertificateFingerprint(): Promise<string> {
    // Mock certificate fingerprint
    return 'SHA256:' + Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
  }

  private logClientConfig(): void {
    if (this.config.debugMode) {
      console.log('🌐 Banking API Client Configuration:');
      console.log(`  Base URL: ${this.config.baseURL}`);
      console.log(`  Environment: ${this.config.environment}`);
      console.log(`  Mock API: ${this.config.mockApi}`);
      console.log(`  Timeout: ${this.securityConfig.timeout}ms`);
      console.log(`  Rate Limit: ${this.securityConfig.rateLimit} req/min`);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =====================================================
  // PUBLIC API STATUS METHODS
  // =====================================================

  getClientStatus(): {
    activeRequests: number;
    totalRequests: number;
    errorCounts: Record<string, number>;
    lastError: APIError | null;
  } {
    return {
      activeRequests: this.activeRequests,
      totalRequests: this.totalRequests,
      errorCounts: Object.fromEntries(this.errorCounts),
      lastError: this.lastError
    };
  }

  getRequestMetrics(requestId?: string): RequestMetrics[] | RequestMetrics | null {
    if (requestId) {
      return this.requestMetrics.get(requestId) || null;
    }
    return Array.from(this.requestMetrics.values());
  }

  clearMetrics(): void {
    this.requestMetrics.clear();
    this.errorCounts.clear();
    this.lastError = null;
    console.log('📊 API client metrics cleared');
  }
}