import { supabase } from '@/integrations/supabase/client';

export interface SecurityAuditEvent {
  id?: string;
  event_type: 'payment_attempt' | 'payment_success' | 'payment_failure' | 'login_attempt' | 'data_access' | 'realtime_connection';
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  resource_id?: string;
  resource_type?: string;
  event_data?: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: string;
  success: boolean;
  error_message?: string;
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  maxPaymentAttempts: number;
  sessionTimeout: number;
  requireTwoFactor: boolean;
  allowedIpRanges?: string[];
  blockedIpAddresses?: string[];
}

export class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;

  constructor() {
    this.config = {
      maxLoginAttempts: 5,
      maxPaymentAttempts: 5,
      sessionTimeout: 3600000, // 1 hour
      requireTwoFactor: false,
    };
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Audit Logging
  async logSecurityEvent(event: SecurityAuditEvent): Promise<void> {
    const eventWithDefaults: SecurityAuditEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      user_agent: event.user_agent || navigator.userAgent,
      session_id: event.session_id || this.generateSessionId(),
    };

    try {
      // Log to console for development
      console.log('Security Event:', eventWithDefaults);

      // Store in localStorage for demo (in production, this would be a secure server-side audit log)
      const auditLog = JSON.parse(localStorage.getItem('security_audit_log') || '[]');
      auditLog.push({
        ...eventWithDefaults,
        id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });

      // Keep only last 500 entries
      if (auditLog.length > 500) {
        auditLog.splice(0, auditLog.length - 500);
      }

      localStorage.setItem('security_audit_log', JSON.stringify(auditLog));

      // In production, also log to Supabase
      if (event.risk_level === 'high' || event.risk_level === 'critical') {
        await this.notifySecurityTeam(eventWithDefaults);
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Payment Security
  async validatePaymentAttempt(customerData: {
    email: string;
    cpf_cnpj: string;
    amount: number;
    payment_method: string;
  }): Promise<{ allowed: boolean; reason?: string; risk_level: 'low' | 'medium' | 'high' }> {
    const { email, cpf_cnpj, amount, payment_method } = customerData;

    // Check attempt rate limiting
    const attempts = this.getPaymentAttempts(email);
    if (attempts >= this.config.maxPaymentAttempts) {
      await this.logSecurityEvent({
        event_type: 'payment_attempt',
        event_data: { email, amount, payment_method, attempts },
        risk_level: 'high',
        success: false,
        error_message: 'Rate limit exceeded',
      });

      return {
        allowed: false,
        reason: 'Muitas tentativas de pagamento. Tente novamente mais tarde.',
        risk_level: 'high'
      };
    }

    // Validate document format
    if (!this.validateCpfCnpj(cpf_cnpj)) {
      await this.logSecurityEvent({
        event_type: 'payment_attempt',
        event_data: { email, cpf_cnpj: 'masked', amount, payment_method },
        risk_level: 'medium',
        success: false,
        error_message: 'Invalid CPF/CNPJ format',
      });

      return {
        allowed: false,
        reason: 'CPF/CNPJ inválido',
        risk_level: 'medium'
      };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      email.includes('test@test.com'),
      email.includes('fake'),
      cpf_cnpj === '00000000000' || cpf_cnpj === '11111111111',
      amount > 100000000, // R$ 1,000,000
      payment_method === 'unknown'
    ];

    const riskLevel = suspiciousPatterns.filter(Boolean).length > 1 ? 'high' : 
                     suspiciousPatterns.some(Boolean) ? 'medium' : 'low';

    await this.logSecurityEvent({
      event_type: 'payment_attempt',
      event_data: { email, amount, payment_method, risk_indicators: suspiciousPatterns.filter(Boolean).length },
      risk_level: riskLevel,
      success: true,
    });

    return { allowed: true, risk_level: riskLevel };
  }

  // Real-time Connection Security
  async validateRealtimeConnection(connectionData: {
    channel: string;
    user_id?: string;
    resource_id?: string;
  }): Promise<{ allowed: boolean; reason?: string }> {
    const { channel, user_id, resource_id } = connectionData;

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !user_id) {
      await this.logSecurityEvent({
        event_type: 'realtime_connection',
        event_data: { channel, resource_id },
        risk_level: 'high',
        success: false,
        error_message: 'Unauthenticated connection attempt',
      });

      return {
        allowed: false,
        reason: 'Conexão não autenticada'
      };
    }

    // Check resource access permissions
    if (resource_id && !await this.checkResourceAccess(user?.id || user_id!, resource_id)) {
      await this.logSecurityEvent({
        event_type: 'realtime_connection',
        user_id: user?.id || user_id,
        event_data: { channel, resource_id },
        risk_level: 'high',
        success: false,
        error_message: 'Unauthorized resource access',
      });

      return {
        allowed: false,
        reason: 'Acesso não autorizado ao recurso'
      };
    }

    await this.logSecurityEvent({
      event_type: 'realtime_connection',
      user_id: user?.id || user_id,
      event_data: { channel, resource_id },
      risk_level: 'low',
      success: true,
    });

    return { allowed: true };
  }

  // Data Access Monitoring
  async logDataAccess(accessData: {
    user_id: string;
    resource_type: string;
    resource_id: string;
    action: 'read' | 'write' | 'delete';
    success: boolean;
    error_message?: string;
  }): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'data_access',
      user_id: accessData.user_id,
      resource_id: accessData.resource_id,
      resource_type: accessData.resource_type,
      event_data: { action: accessData.action },
      risk_level: accessData.action === 'delete' ? 'medium' : 'low',
      success: accessData.success,
      error_message: accessData.error_message,
    });
  }

  // Helper Methods
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPaymentAttempts(email: string): number {
    const attempts = localStorage.getItem(`payment_attempts_${email}`);
    return attempts ? parseInt(attempts) : 0;
  }

  private incrementPaymentAttempts(email: string): void {
    const attempts = this.getPaymentAttempts(email) + 1;
    localStorage.setItem(`payment_attempts_${email}`, attempts.toString());
    
    // Clear attempts after 1 hour
    setTimeout(() => {
      localStorage.removeItem(`payment_attempts_${email}`);
    }, 3600000);
  }

  private validateCpfCnpj(document: string): boolean {
    // Remove non-numeric characters
    const cleanDoc = document.replace(/\D/g, '');

    // Check CPF (11 digits)
    if (cleanDoc.length === 11) {
      return this.validateCpf(cleanDoc);
    }

    // Check CNPJ (14 digits)
    if (cleanDoc.length === 14) {
      return this.validateCnpj(cleanDoc);
    }

    return false;
  }

  private validateCpf(cpf: string): boolean {
    // Basic CPF validation algorithm
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(cpf[9]) !== digit1) {
      return false;
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(cpf[10]) === digit2;
  }

  private validateCnpj(cnpj: string): boolean {
    // Basic CNPJ validation algorithm
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj[i]) * weights1[i];
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(cnpj[12]) !== digit1) {
      return false;
    }

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj[i]) * weights2[i];
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(cnpj[13]) === digit2;
  }

  private async checkResourceAccess(userId: string, resourceId: string): Promise<boolean> {
    // In a real implementation, this would check database permissions
    // For now, we'll assume access is allowed if user is authenticated
    return true;
  }

  private async notifySecurityTeam(event: SecurityAuditEvent): Promise<void> {
    // In production, this would send alerts to security team
    console.warn('High-risk security event detected:', event);
  }

  // Public API for getting audit logs
  getSecurityAuditLog(): SecurityAuditEvent[] {
    try {
      return JSON.parse(localStorage.getItem('security_audit_log') || '[]');
    } catch {
      return [];
    }
  }

  clearSecurityAuditLog(): void {
    localStorage.removeItem('security_audit_log');
  }

  // Connection monitoring
  monitorConnection(connectionId: string): {
    disconnect: () => void;
    getStatus: () => 'connected' | 'disconnected' | 'error';
  } {
    const startTime = Date.now();
    let status: 'connected' | 'disconnected' | 'error' = 'connected';
    let heartbeatInterval: NodeJS.Timeout;

    // Heartbeat monitoring
    heartbeatInterval = setInterval(() => {
      // In a real implementation, this would ping the server
      const elapsed = Date.now() - startTime;
      if (elapsed > 300000) { // 5 minutes
        status = 'error';
        this.logSecurityEvent({
          event_type: 'realtime_connection',
          event_data: { connectionId, elapsed, reason: 'heartbeat_timeout' },
          risk_level: 'medium',
          success: false,
          error_message: 'Connection heartbeat timeout',
        });
      }
    }, 30000); // Check every 30 seconds

    return {
      disconnect: () => {
        status = 'disconnected';
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        this.logSecurityEvent({
          event_type: 'realtime_connection',
          event_data: { connectionId, action: 'disconnect', elapsed: Date.now() - startTime },
          risk_level: 'low',
          success: true,
        });
      },
      getStatus: () => status,
    };
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance();