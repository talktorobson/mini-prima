// 💰 Financial Validation Service
// D'Avila Reis Legal Practice Management System
// Comprehensive validation for Brazilian financial forms and calculations

export interface FinancialValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FinancialAmount {
  value: number;
  currency: 'BRL';
  formatted: string;
}

export interface PaymentInstallment {
  number: number;
  amount: number;
  dueDate: string;
  interestRate?: number;
}

export interface ValidationConfig {
  minAmount?: number;
  maxAmount?: number;
  allowZero?: boolean;
  currency?: 'BRL';
  locale?: 'pt-BR';
}

class FinancialValidationService {
  private readonly DEFAULT_CONFIG: ValidationConfig = {
    minAmount: 0.01,
    maxAmount: 999999999.99,
    allowZero: false,
    currency: 'BRL',
    locale: 'pt-BR'
  };

  // Brazilian Real currency formatting and validation
  formatCurrency(amount: number | string, config?: ValidationConfig): string {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numValue)) {
      return 'R$ 0,00';
    }

    return numValue.toLocaleString(mergedConfig.locale, {
      style: 'currency',
      currency: mergedConfig.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Parse Brazilian currency format to number
  parseCurrency(value: string): number {
    if (!value) return 0;
    
    // Remove currency symbol and spaces
    const cleaned = value.replace(/[R$\s]/g, '');
    
    // Handle Brazilian decimal separator (, instead of .)
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Validate financial amounts
  validateAmount(amount: number | string, config?: ValidationConfig): FinancialValidationResult {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const numValue = typeof amount === 'string' ? this.parseCurrency(amount) : amount;
    
    // Check if value is a valid number
    if (isNaN(numValue)) {
      errors.push('Valor deve ser um número válido');
      return { isValid: false, errors, warnings };
    }

    // Check for negative values
    if (numValue < 0) {
      errors.push('Valor não pode ser negativo');
    }

    // Check minimum amount
    if (!mergedConfig.allowZero && numValue === 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (mergedConfig.minAmount && numValue < mergedConfig.minAmount) {
      errors.push(`Valor mínimo é ${this.formatCurrency(mergedConfig.minAmount)}`);
    }

    // Check maximum amount
    if (mergedConfig.maxAmount && numValue > mergedConfig.maxAmount) {
      errors.push(`Valor máximo é ${this.formatCurrency(mergedConfig.maxAmount)}`);
    }

    // Add warnings for unusual amounts
    if (numValue > 1000000) {
      warnings.push('Valor muito alto - verifique se está correto');
    }

    if (numValue < 1 && numValue > 0) {
      warnings.push('Valor muito baixo - verifique se está correto');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate percentage values (for fees, success rates, etc.)
  validatePercentage(percentage: number | string, config?: { min?: number; max?: number }): FinancialValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const numValue = typeof percentage === 'string' ? parseFloat(percentage.replace(',', '.')) : percentage;
    
    if (isNaN(numValue)) {
      errors.push('Percentual deve ser um número válido');
      return { isValid: false, errors, warnings };
    }

    const minPercentage = config?.min ?? 0;
    const maxPercentage = config?.max ?? 100;

    if (numValue < minPercentage) {
      errors.push(`Percentual mínimo é ${minPercentage}%`);
    }

    if (numValue > maxPercentage) {
      errors.push(`Percentual máximo é ${maxPercentage}%`);
    }

    // Warnings for unusual percentages
    if (numValue > 50 && maxPercentage === 100) {
      warnings.push('Percentual alto - verifique se está correto');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate CPF (Brazilian individual tax ID)
  validateCPF(cpf: string): FinancialValidationResult {
    const errors: string[] = [];
    
    if (!cpf) {
      errors.push('CPF é obrigatório');
      return { isValid: false, errors };
    }

    // Remove formatting
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    
    if (cleanCPF.length !== 11) {
      errors.push('CPF deve conter 11 dígitos');
      return { isValid: false, errors };
    }

    // Check for all same digits
    if (/^(\d)\1+$/.test(cleanCPF)) {
      errors.push('CPF inválido');
      return { isValid: false, errors };
    }

    // Validate CPF checksum
    const digits = cleanCPF.split('').map(Number);
    
    // First check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    let checkDigit1 = 11 - (sum % 11);
    if (checkDigit1 >= 10) checkDigit1 = 0;
    
    if (digits[9] !== checkDigit1) {
      errors.push('CPF inválido');
      return { isValid: false, errors };
    }

    // Second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * (11 - i);
    }
    let checkDigit2 = 11 - (sum % 11);
    if (checkDigit2 >= 10) checkDigit2 = 0;
    
    if (digits[10] !== checkDigit2) {
      errors.push('CPF inválido');
      return { isValid: false, errors };
    }

    return { isValid: true, errors };
  }

  // Validate CNPJ (Brazilian company tax ID)
  validateCNPJ(cnpj: string): FinancialValidationResult {
    const errors: string[] = [];
    
    if (!cnpj) {
      errors.push('CNPJ é obrigatório');
      return { isValid: false, errors };
    }

    // Remove formatting
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCNPJ.length !== 14) {
      errors.push('CNPJ deve conter 14 dígitos');
      return { isValid: false, errors };
    }

    // Check for all same digits
    if (/^(\d)\1+$/.test(cleanCNPJ)) {
      errors.push('CNPJ inválido');
      return { isValid: false, errors };
    }

    // Validate CNPJ checksum
    const digits = cleanCNPJ.split('').map(Number);
    
    // First check digit
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * weights1[i];
    }
    let checkDigit1 = 11 - (sum % 11);
    if (checkDigit1 >= 10) checkDigit1 = 0;
    
    if (digits[12] !== checkDigit1) {
      errors.push('CNPJ inválido');
      return { isValid: false, errors };
    }

    // Second check digit
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += digits[i] * weights2[i];
    }
    let checkDigit2 = 11 - (sum % 11);
    if (checkDigit2 >= 10) checkDigit2 = 0;
    
    if (digits[13] !== checkDigit2) {
      errors.push('CNPJ inválido');
      return { isValid: false, errors };
    }

    return { isValid: true, errors };
  }

  // Format CPF
  formatCPF(cpf: string): string {
    const clean = cpf.replace(/[^\d]/g, '');
    if (clean.length !== 11) return cpf;
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // Format CNPJ
  formatCNPJ(cnpj: string): string {
    const clean = cnpj.replace(/[^\d]/g, '');
    if (clean.length !== 14) return cnpj;
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  // Validate payment installment plan
  validateInstallmentPlan(
    totalAmount: number,
    installments: number,
    interestRate?: number
  ): FinancialValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate total amount
    const amountValidation = this.validateAmount(totalAmount);
    if (!amountValidation.isValid) {
      errors.push(...amountValidation.errors);
    }

    // Validate installment count
    if (!Number.isInteger(installments) || installments < 1) {
      errors.push('Número de parcelas deve ser um número inteiro positivo');
    }

    if (installments > 60) {
      errors.push('Número máximo de parcelas é 60');
    }

    if (installments > 24) {
      warnings.push('Número alto de parcelas - considere revisar');
    }

    // Validate interest rate if provided
    if (interestRate !== undefined) {
      const interestValidation = this.validatePercentage(interestRate, { min: 0, max: 15 });
      if (!interestValidation.isValid) {
        errors.push(...interestValidation.errors.map(e => `Taxa de juros: ${e}`));
      }
    }

    // Check minimum installment amount
    const installmentAmount = totalAmount / installments;
    if (installmentAmount < 50) {
      warnings.push('Valor da parcela muito baixo (< R$ 50,00)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Calculate installment plan with compound interest
  calculateInstallmentPlan(
    totalAmount: number,
    installments: number,
    interestRate: number = 0
  ): PaymentInstallment[] {
    const plan: PaymentInstallment[] = [];
    
    if (interestRate === 0) {
      // Simple division for no interest
      const installmentAmount = Math.round((totalAmount / installments) * 100) / 100;
      const lastInstallmentAmount = totalAmount - (installmentAmount * (installments - 1));
      
      for (let i = 1; i <= installments; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        
        plan.push({
          number: i,
          amount: i === installments ? lastInstallmentAmount : installmentAmount,
          dueDate: dueDate.toISOString().split('T')[0],
          interestRate: 0
        });
      }
    } else {
      // Compound interest calculation
      const monthlyRate = interestRate / 100;
      const installmentAmount = totalAmount * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / (Math.pow(1 + monthlyRate, installments) - 1);
      
      for (let i = 1; i <= installments; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        
        plan.push({
          number: i,
          amount: Math.round(installmentAmount * 100) / 100,
          dueDate: dueDate.toISOString().split('T')[0],
          interestRate
        });
      }
    }

    return plan;
  }

  // Validate PIX key format
  validatePixKey(pixKey: string, type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'): FinancialValidationResult {
    const errors: string[] = [];
    
    if (!pixKey) {
      errors.push('Chave PIX é obrigatória');
      return { isValid: false, errors };
    }

    switch (type) {
      case 'cpf':
        return this.validateCPF(pixKey);
      
      case 'cnpj':
        return this.validateCNPJ(pixKey);
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(pixKey)) {
          errors.push('Email inválido');
        }
        break;
      
      case 'phone':
        const phoneRegex = /^\+55\d{10,11}$/;
        if (!phoneRegex.test(pixKey)) {
          errors.push('Telefone deve estar no formato +5511999999999');
        }
        break;
      
      case 'random':
        const randomKeyRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
        if (!randomKeyRegex.test(pixKey)) {
          errors.push('Chave aleatória inválida');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate bank account number
  validateBankAccount(
    bank: string,
    agency: string,
    account: string,
    digit?: string
  ): FinancialValidationResult {
    const errors: string[] = [];

    if (!bank || bank.length !== 3) {
      errors.push('Código do banco deve ter 3 dígitos');
    }

    if (!agency || agency.length < 3 || agency.length > 5) {
      errors.push('Agência deve ter entre 3 e 5 dígitos');
    }

    if (!account || account.length < 4 || account.length > 12) {
      errors.push('Conta deve ter entre 4 e 12 dígitos');
    }

    if (digit && (digit.length < 1 || digit.length > 2)) {
      errors.push('Dígito verificador deve ter 1 ou 2 dígitos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format phone number to Brazilian standard
  formatPhone(phone: string): string {
    const clean = phone.replace(/[^\d]/g, '');
    
    if (clean.length === 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  }

  // Format CEP (Brazilian postal code)
  formatCEP(cep: string): string {
    const clean = cep.replace(/[^\d]/g, '');
    if (clean.length === 8) {
      return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
  }

  // Validate CEP
  validateCEP(cep: string): FinancialValidationResult {
    const errors: string[] = [];
    const clean = cep.replace(/[^\d]/g, '');
    
    if (clean.length !== 8) {
      errors.push('CEP deve conter 8 dígitos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Round to Brazilian currency precision (centavos)
  roundToCents(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  // Validate payment method specific requirements
  validatePaymentMethod(
    method: 'pix' | 'boleto' | 'credit_card' | 'bank_transfer',
    data: any
  ): FinancialValidationResult {
    const errors: string[] = [];

    switch (method) {
      case 'pix':
        if (!data.pixKey) {
          errors.push('Chave PIX é obrigatória');
        }
        if (!data.amount || data.amount <= 0) {
          errors.push('Valor deve ser maior que zero');
        }
        break;

      case 'boleto':
        if (!data.dueDate) {
          errors.push('Data de vencimento é obrigatória');
        }
        if (!data.payerName) {
          errors.push('Nome do pagador é obrigatório');
        }
        if (!data.amount || data.amount <= 0) {
          errors.push('Valor deve ser maior que zero');
        }
        break;

      case 'credit_card':
        if (!data.cardNumber || data.cardNumber.length < 13) {
          errors.push('Número do cartão inválido');
        }
        if (!data.expiryDate) {
          errors.push('Data de vencimento do cartão é obrigatória');
        }
        if (!data.cvv || data.cvv.length < 3) {
          errors.push('CVV inválido');
        }
        break;

      case 'bank_transfer':
        if (!data.bank || !data.agency || !data.account) {
          errors.push('Dados bancários incompletos');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const financialValidationService = new FinancialValidationService();
export default financialValidationService;