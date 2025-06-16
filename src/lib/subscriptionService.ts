// 🚀 SUBSCRIPTION MANAGEMENT SERVICE
// Legal-as-a-Service Platform - Subscription & Billing Logic

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'basic' | 'professional' | 'enterprise';
  category: 'labor_law' | 'corporate_law' | 'full_service';
  monthly_price: number;
  yearly_price?: number;
  description: string;
  features: Record<string, any>;
  consulting_hours_quota: number;
  document_review_quota: number;
  legal_questions_quota: number;
  litigation_discount_percentage: number;
  is_active: boolean;
}

export interface ClientSubscription {
  id: string;
  client_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'paused' | 'trial';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  next_billing_date?: string;
  subscription_start_date: string;
  monthly_amount: number;
  yearly_amount?: number;
  usage_tracking: {
    consulting_hours_used: number;
    documents_reviewed: number;
    questions_asked: number;
  };
  auto_renew: boolean;
  plan?: SubscriptionPlan;
}

export interface SubscriptionUsage {
  id: string;
  subscription_id: string;
  usage_type: 'consulting_hours' | 'document_review' | 'legal_questions' | 'template_access';
  usage_date: string;
  quantity_used: number;
  staff_id?: string;
  case_id?: string;
  description?: string;
  billable_separately: boolean;
  hourly_rate?: number;
}

export interface PaymentPlan {
  totalAmount: number;
  numberOfInstallments: number;
  interestRate: number; // Monthly rate as decimal
  downPayment?: number;
}

export interface PaymentInstallment {
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
}

export interface DiscountCalculation {
  subscriptionTier: 'basic' | 'professional' | 'enterprise';
  subscriptionCategory: 'labor_law' | 'corporate_law' | 'full_service';
  litigationType: 'labor_litigation' | 'corporate_litigation' | 'civil_litigation';
  originalAmount: number;
}

// =====================================================
// SUBSCRIPTION DISCOUNT MATRIX
// =====================================================

const SUBSCRIPTION_DISCOUNT_MATRIX: Record<string, Record<string, Record<string, number>>> = {
  basic: {
    labor_law: {
      labor_litigation: 15, // 15% off labor litigation for basic labor law subscribers
      corporate_litigation: 5,
      civil_litigation: 0
    },
    corporate_law: {
      labor_litigation: 5,
      corporate_litigation: 15,
      civil_litigation: 5
    }
  },
  professional: {
    labor_law: {
      labor_litigation: 25, // 25% off for professional tier
      corporate_litigation: 10,
      civil_litigation: 5
    },
    corporate_law: {
      labor_litigation: 10,
      corporate_litigation: 25,
      civil_litigation: 10
    },
    full_service: {
      labor_litigation: 20,
      corporate_litigation: 20,
      civil_litigation: 15
    }
  },
  enterprise: {
    full_service: {
      labor_litigation: 30, // Maximum discount for enterprise full-service
      corporate_litigation: 30,
      civil_litigation: 25
    }
  }
};

// =====================================================
// SUBSCRIPTION MANAGEMENT FUNCTIONS
// =====================================================

export const subscriptionService = {
  
  // Get all available subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price');

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }

    return data || [];
  },

  // Get client's active subscriptions
  async getClientSubscriptions(clientId: string): Promise<ClientSubscription[]> {
    const { data, error } = await supabase
      .from('client_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('client_id', clientId)
      .in('status', ['active', 'trial', 'past_due'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client subscriptions:', error);
      throw error;
    }

    return data || [];
  },

  // Create new subscription for client
  async createSubscription(
    clientId: string, 
    planId: string, 
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<ClientSubscription> {
    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Subscription plan not found');
    }

    const amount = billingCycle === 'yearly' ? plan.yearly_price || plan.monthly_price * 12 : plan.monthly_price;
    const periodEnd = new Date();
    
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const subscriptionData = {
      client_id: clientId,
      plan_id: planId,
      status: 'trial', // Start with trial
      billing_cycle: billingCycle,
      current_period_start: new Date().toISOString().split('T')[0],
      current_period_end: periodEnd.toISOString().split('T')[0],
      next_billing_date: periodEnd.toISOString().split('T')[0],
      monthly_amount: plan.monthly_price,
      yearly_amount: plan.yearly_price,
      usage_tracking: {
        consulting_hours_used: 0,
        documents_reviewed: 0,
        questions_asked: 0
      }
    };

    const { data, error } = await supabase
      .from('client_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }

    return data;
  },

  // Track subscription usage
  async trackUsage(
    subscriptionId: string,
    usageType: SubscriptionUsage['usage_type'],
    quantity: number = 1,
    staffId?: string,
    caseId?: string,
    description?: string
  ): Promise<SubscriptionUsage> {
    const usageData = {
      subscription_id: subscriptionId,
      usage_type: usageType,
      quantity_used: quantity,
      staff_id: staffId,
      case_id: caseId,
      description
    };

    const { data, error } = await supabase
      .from('subscription_usage')
      .insert(usageData)
      .select()
      .single();

    if (error) {
      console.error('Error tracking usage:', error);
      throw error;
    }

    // Update subscription usage tracking
    await this.updateUsageTracking(subscriptionId, usageType, quantity);

    return data;
  },

  // Update subscription usage tracking summary
  async updateUsageTracking(
    subscriptionId: string, 
    usageType: SubscriptionUsage['usage_type'], 
    quantity: number
  ): Promise<void> {
    const { data: subscription, error: fetchError } = await supabase
      .from('client_subscriptions')
      .select('usage_tracking')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      throw new Error('Subscription not found');
    }

    const currentTracking = subscription.usage_tracking || {
      consulting_hours_used: 0,
      documents_reviewed: 0,
      questions_asked: 0
    };

    // Update the appropriate usage counter
    switch (usageType) {
      case 'consulting_hours':
        currentTracking.consulting_hours_used += quantity;
        break;
      case 'document_review':
        currentTracking.documents_reviewed += quantity;
        break;
      case 'legal_questions':
        currentTracking.questions_asked += quantity;
        break;
    }

    const { error: updateError } = await supabase
      .from('client_subscriptions')
      .update({ usage_tracking: currentTracking })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error updating usage tracking:', updateError);
      throw updateError;
    }
  },

  // Get subscription usage history
  async getUsageHistory(subscriptionId: string): Promise<SubscriptionUsage[]> {
    const { data, error } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching usage history:', error);
      throw error;
    }

    return data || [];
  }
};

// =====================================================
// BILLING & DISCOUNT CALCULATIONS
// =====================================================

export const billingService = {

  // Calculate subscription discount for litigation
  calculateSubscriptionDiscount(config: DiscountCalculation): {
    discountPercentage: number;
    discountAmount: number;
    finalAmount: number;
    discountReason: string;
  } {
    const discountPercentage = 
      SUBSCRIPTION_DISCOUNT_MATRIX[config.subscriptionTier]?.[config.subscriptionCategory]?.[config.litigationType] || 0;
    
    const discountAmount = config.originalAmount * (discountPercentage / 100);
    const finalAmount = config.originalAmount - discountAmount;
    
    const discountReason = discountPercentage > 0 
      ? `${discountPercentage}% subscriber discount (${config.subscriptionTier} ${config.subscriptionCategory})`
      : 'No subscription discount applicable';
    
    return {
      discountPercentage,
      discountAmount,
      finalAmount,
      discountReason
    };
  },

  // Calculate payment plan installments with precision fixes
  calculatePaymentPlan(config: PaymentPlan): {
    installments: PaymentInstallment[];
    totalWithInterest: number;
    totalInterest: number;
  } {
    // Input validation
    if (config.totalAmount <= 0) {
      throw new Error('Total amount must be greater than zero');
    }
    if (config.numberOfInstallments <= 0) {
      throw new Error('Number of installments must be greater than zero');
    }
    if (config.interestRate < 0) {
      throw new Error('Interest rate cannot be negative');
    }
    
    const downPayment = Math.max(0, config.downPayment || 0);
    const financedAmount = config.totalAmount - downPayment;
    
    // Handle edge case where down payment equals or exceeds total
    if (financedAmount <= 0) {
      return {
        installments: [],
        totalWithInterest: config.totalAmount,
        totalInterest: 0
      };
    }
    
    // Handle single installment case
    if (config.numberOfInstallments === 1) {
      return {
        installments: [{
          installmentNumber: 1,
          dueDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
          principalAmount: financedAmount,
          interestAmount: 0,
          totalAmount: financedAmount
        }],
        totalWithInterest: config.totalAmount,
        totalInterest: 0
      };
    }
    
    // Calculate monthly payment using compound interest formula with precision handling
    const monthlyRate = config.interestRate;
    let monthlyPayment: number;
    
    if (monthlyRate === 0) {
      monthlyPayment = financedAmount / config.numberOfInstallments;
    } else {
      const powerFactor = Math.pow(1 + monthlyRate, config.numberOfInstallments);
      monthlyPayment = (financedAmount * monthlyRate * powerFactor) / (powerFactor - 1);
    }
    
    // Round to cents to avoid floating point precision issues
    monthlyPayment = Math.round(monthlyPayment * 100) / 100;
    
    const installments: PaymentInstallment[] = [];
    let remainingBalance = financedAmount;
    let totalPaid = 0;
    
    for (let i = 1; i <= config.numberOfInstallments; i++) {
      const interestAmount = Math.round(remainingBalance * monthlyRate * 100) / 100;
      let principalAmount = monthlyPayment - interestAmount;
      
      // For the last installment, adjust for any rounding differences
      if (i === config.numberOfInstallments) {
        principalAmount = remainingBalance;
        monthlyPayment = principalAmount + interestAmount;
      }
      
      // Round amounts to cents
      principalAmount = Math.round(principalAmount * 100) / 100;
      const finalTotalAmount = Math.round((principalAmount + interestAmount) * 100) / 100;
      
      installments.push({
        installmentNumber: i,
        dueDate: new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000)), // 30 days apart
        principalAmount,
        interestAmount,
        totalAmount: finalTotalAmount
      });
      
      remainingBalance = Math.round((remainingBalance - principalAmount) * 100) / 100;
      totalPaid += finalTotalAmount;
    }
    
    const totalWithInterest = Math.round((downPayment + totalPaid) * 100) / 100;
    const totalInterest = Math.round((totalWithInterest - config.totalAmount) * 100) / 100;
    
    return {
      installments,
      totalWithInterest,
      totalInterest
    };
  },

  // Get client's active subscription for discount calculation
  async getClientActiveSubscription(clientId: string): Promise<ClientSubscription | null> {
    const subscriptions = await subscriptionService.getClientSubscriptions(clientId);
    return subscriptions.find(sub => sub.status === 'active') || null;
  },

  // Calculate automatic discount for a client's case
  async calculateClientCaseDiscount(
    clientId: string,
    litigationType: 'labor_litigation' | 'corporate_litigation' | 'civil_litigation',
    originalAmount: number
  ): Promise<{
    hasDiscount: boolean;
    discountPercentage: number;
    discountAmount: number;
    finalAmount: number;
    discountReason: string;
  }> {
    const subscription = await this.getClientActiveSubscription(clientId);
    
    if (!subscription || !subscription.plan) {
      return {
        hasDiscount: false,
        discountPercentage: 0,
        discountAmount: 0,
        finalAmount: originalAmount,
        discountReason: 'No active subscription'
      };
    }

    const discountResult = this.calculateSubscriptionDiscount({
      subscriptionTier: subscription.plan.tier,
      subscriptionCategory: subscription.plan.category,
      litigationType,
      originalAmount
    });

    return {
      hasDiscount: discountResult.discountPercentage > 0,
      ...discountResult
    };
  }
};

// =====================================================
// BUSINESS INTELLIGENCE FUNCTIONS
// =====================================================

export const analyticsService = {
  
  // Calculate Monthly Recurring Revenue (MRR)
  async calculateMRR(): Promise<{
    totalMRR: number;
    mrrByTier: Record<string, number>;
    activeSubscriptions: number;
    avgRevenuePerUser: number;
  }> {
    const { data: activeSubscriptions, error } = await supabase
      .from('client_subscriptions')
      .select(`
        monthly_amount,
        plan:subscription_plans(tier)
      `)
      .eq('status', 'active');

    if (error) {
      console.error('Error calculating MRR:', error);
      throw error;
    }

    const totalMRR = activeSubscriptions?.reduce((sum, sub) => sum + (sub.monthly_amount || 0), 0) || 0;
    const mrrByTier: Record<string, number> = {};
    
    activeSubscriptions?.forEach(sub => {
      const tier = sub.plan?.tier || 'unknown';
      mrrByTier[tier] = (mrrByTier[tier] || 0) + (sub.monthly_amount || 0);
    });

    return {
      totalMRR,
      mrrByTier,
      activeSubscriptions: activeSubscriptions?.length || 0,
      avgRevenuePerUser: activeSubscriptions?.length ? totalMRR / activeSubscriptions.length : 0
    };
  },

  // Calculate subscription to litigation conversion rate
  async calculateCrossSellMetrics(): Promise<{
    totalSubscribers: number;
    subscribersWithCases: number;
    conversionRate: number;
    avgDiscountApplied: number;
    revenueFromCrossSell: number;
  }> {
    // Get all active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('client_subscriptions')
      .select('client_id')
      .eq('status', 'active');

    if (subError) {
      console.error('Error fetching subscribers:', subError);
      throw subError;
    }

    const subscriberClientIds = subscribers?.map(s => s.client_id) || [];

    // Get cases for subscribers with billing configs
    const { data: subscriberCases, error: casesError } = await supabase
      .from('case_billing_config')
      .select(`
        case_id,
        subscription_discount_applied,
        discounted_amount,
        cases!inner(client_id)
      `)
      .in('cases.client_id', subscriberClientIds);

    if (casesError) {
      console.error('Error fetching subscriber cases:', casesError);
      throw casesError;
    }

    const uniqueSubscribersWithCases = new Set(subscriberCases?.map(c => c.cases.client_id) || []);
    const totalDiscountedRevenue = subscriberCases?.reduce((sum, c) => sum + (c.discounted_amount || 0), 0) || 0;
    const totalDiscountApplied = subscriberCases?.reduce((sum, c) => sum + (c.subscription_discount_applied || 0), 0) || 0;

    return {
      totalSubscribers: subscriberClientIds.length,
      subscribersWithCases: uniqueSubscribersWithCases.size,
      conversionRate: subscriberClientIds.length > 0 ? (uniqueSubscribersWithCases.size / subscriberClientIds.length) * 100 : 0,
      avgDiscountApplied: subscriberCases?.length ? totalDiscountApplied / subscriberCases.length : 0,
      revenueFromCrossSell: totalDiscountedRevenue
    };
  }
};