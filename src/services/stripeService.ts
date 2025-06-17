import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type StripeSettings = Database['public']['Tables']['stripe_settings']['Row'];
type StripeProduct = Database['public']['Tables']['stripe_products']['Row'];
type StripeCustomer = Database['public']['Tables']['stripe_customers']['Row'];
type StripeSubscription = Database['public']['Tables']['stripe_subscriptions']['Row'];
type StripePayment = Database['public']['Tables']['stripe_payments']['Row'];

export interface StripeConfig {
  publicKey: string;
  environment: 'sandbox' | 'production';
  acceptedPaymentMethods: string[];
  currency: string;
  locale: string;
}

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  payment_methods: string[];
  pix_qr_code?: string;
  pix_code?: string;
  boleto_url?: string;
  boleto_due_date?: string;
}

export interface SubscriptionPlan {
  id: string;
  stripe_product_id: string;
  name: string;
  description: string;
  price_amount: number;
  currency: string;
  billing_interval: string;
  features: string[];
  limits: Record<string, any>;
  is_featured: boolean;
}

export interface CustomerSubscription {
  id: string;
  stripe_subscription_id: string;
  product_name: string;
  amount: number;
  currency: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  next_payment_date?: string;
  cancel_at_period_end: boolean;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  description: string;
  payment_type: string;
  payment_created_at: string;
  payment_confirmed_at?: string;
  receipt_url?: string;
  boleto_url?: string;
  pix_code?: string;
}

export const stripeService = {
  // Configuration and Setup
  async getStripeConfig(): Promise<StripeConfig> {
    const { data: settings, error } = await supabase
      .from('stripe_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error || !settings) {
      throw new Error('Configuração do Stripe não encontrada');
    }

    return {
      publicKey: settings.stripe_public_key || '',
      environment: settings.environment as 'sandbox' | 'production',
      acceptedPaymentMethods: [
        ...(settings.accept_credit_card ? ['card'] : []),
        ...(settings.accept_pix ? ['pix'] : []),
        ...(settings.accept_boleto ? ['boleto'] : []),
        ...(settings.accept_bank_transfer ? ['bank_transfer'] : []),
      ],
      currency: settings.default_currency || 'BRL',
      locale: settings.locale || 'pt-BR',
    };
  },

  async updateStripeSettings(settings: {
    stripe_public_key?: string;
    stripe_secret_key?: string;
    stripe_webhook_secret?: string;
    environment?: 'sandbox' | 'production';
    accept_pix?: boolean;
    accept_boleto?: boolean;
    accept_credit_card?: boolean;
    company_name?: string;
    company_tax_id?: string;
  }): Promise<StripeSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data: updatedSettings, error } = await supabase
      .from('stripe_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;
    return updatedSettings;
  },

  // Product and Subscription Management
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data: products, error } = await supabase
      .from('stripe_products')
      .select('*')
      .eq('is_active', true)
      .eq('product_type', 'subscription')
      .order('display_order', { ascending: true })
      .order('price_amount', { ascending: true });

    if (error) throw error;

    return (products || []).map(product => ({
      id: product.id,
      stripe_product_id: product.stripe_product_id,
      name: product.name,
      description: product.description || '',
      price_amount: product.price_amount,
      currency: product.currency || 'BRL',
      billing_interval: product.billing_interval || 'month',
      features: product.features as string[] || [],
      limits: product.limits as Record<string, any> || {},
      is_featured: product.is_featured || false,
    }));
  },

  async getOneTimeServices(): Promise<SubscriptionPlan[]> {
    const { data: products, error } = await supabase
      .from('stripe_products')
      .select('*')
      .eq('is_active', true)
      .eq('product_type', 'one_time')
      .order('display_order', { ascending: true })
      .order('price_amount', { ascending: true });

    if (error) throw error;

    return (products || []).map(product => ({
      id: product.id,
      stripe_product_id: product.stripe_product_id,
      name: product.name,
      description: product.description || '',
      price_amount: product.price_amount,
      currency: product.currency || 'BRL',
      billing_interval: 'one_time',
      features: product.features as string[] || [],
      limits: product.limits as Record<string, any> || {},
      is_featured: product.is_featured || false,
    }));
  },

  async createProduct(productData: {
    name: string;
    description: string;
    product_type: 'subscription' | 'one_time';
    price_amount: number;
    billing_interval?: string;
    service_category: string;
    practice_area: string;
    features: string[];
    limits: Record<string, any>;
    tax_rate?: number;
  }): Promise<StripeProduct> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // In a real implementation, this would create the product in Stripe first
    const mockStripeProductId = `prod_${Date.now()}`;
    const mockStripePriceId = productData.product_type === 'subscription' ? `price_${Date.now()}` : undefined;

    const { data: product, error } = await supabase
      .from('stripe_products')
      .insert({
        stripe_product_id: mockStripeProductId,
        stripe_price_id: mockStripePriceId,
        name: productData.name,
        description: productData.description,
        product_type: productData.product_type,
        price_amount: productData.price_amount,
        billing_interval: productData.billing_interval,
        service_category: productData.service_category,
        practice_area: productData.practice_area,
        features: productData.features,
        limits: productData.limits,
        tax_rate: productData.tax_rate || 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return product;
  },

  // Customer Management
  async getOrCreateStripeCustomer(clientId: string, customerData: {
    email: string;
    name: string;
    phone?: string;
    cpf_cnpj?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country?: string;
    };
  }): Promise<StripeCustomer> {
    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (existingCustomer) {
      return existingCustomer;
    }

    // Create new Stripe customer (mock implementation)
    const mockStripeCustomerId = `cus_${Date.now()}`;

    const { data: newCustomer, error } = await supabase
      .from('stripe_customers')
      .insert({
        client_id: clientId,
        stripe_customer_id: mockStripeCustomerId,
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        cpf_cnpj: customerData.cpf_cnpj,
        address_line1: customerData.address?.line1,
        address_line2: customerData.address?.line2,
        address_city: customerData.address?.city,
        address_state: customerData.address?.state,
        address_postal_code: customerData.address?.postal_code,
        address_country: customerData.address?.country || 'BR',
      })
      .select()
      .single();

    if (error) throw error;
    return newCustomer;
  },

  // Payment Intent Creation
  async createPaymentIntent(data: {
    amount: number;
    currency?: string;
    client_id: string;
    description: string;
    payment_type: 'subscription' | 'one_time' | 'case_payment';
    case_id?: string;
    payment_methods?: string[];
    automatic_payment_methods?: boolean;
  }): Promise<PaymentIntent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // In a real implementation, this would create a payment intent with Stripe
    const mockPaymentIntentId = `pi_${Date.now()}`;
    const mockClientSecret = `${mockPaymentIntentId}_secret_${Date.now()}`;

    const paymentMethods = data.payment_methods || ['card', 'pix', 'boleto'];
    
    // Mock Brazilian payment data
    const mockPaymentData: PaymentIntent = {
      id: mockPaymentIntentId,
      client_secret: mockClientSecret,
      amount: data.amount,
      currency: data.currency || 'BRL',
      payment_methods: paymentMethods,
    };

    // Add Brazilian payment method details
    if (paymentMethods.includes('pix')) {
      mockPaymentData.pix_qr_code = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      mockPaymentData.pix_code = '00020126330014BR.GOV.BCB.PIX0111123456789012345204000053039865802BR5925D Avila Reis Advogados6009SAO PAULO62070503***6304ABCD';
    }

    if (paymentMethods.includes('boleto')) {
      mockPaymentData.boleto_url = 'https://example.com/boleto/123456789.pdf';
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3); // 3 days from now
      mockPaymentData.boleto_due_date = dueDate.toISOString().split('T')[0];
    }

    // Store payment intent in database
    const { error } = await supabase
      .from('stripe_payments')
      .insert({
        stripe_payment_intent_id: mockPaymentIntentId,
        client_id: data.client_id,
        case_id: data.case_id,
        amount: data.amount,
        currency: data.currency || 'BRL',
        payment_status: 'pending',
        description: data.description,
        payment_type: data.payment_type,
        payment_created_at: new Date().toISOString(),
        pix_qr_code: mockPaymentData.pix_qr_code,
        pix_code: mockPaymentData.pix_code,
        boleto_url: mockPaymentData.boleto_url,
        boleto_due_date: mockPaymentData.boleto_due_date,
      });

    if (error) throw error;

    return mockPaymentData;
  },

  // Subscription Management
  async createSubscription(data: {
    client_id: string;
    product_id: string;
    payment_method_id?: string;
    trial_days?: number;
    discount_percent?: number;
  }): Promise<StripeSubscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('stripe_products')
      .select('*')
      .eq('id', data.product_id)
      .single();

    if (productError) throw productError;

    // Get or create Stripe customer
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', data.client_id)
      .single();

    if (clientError) throw clientError;

    const stripeCustomer = await this.getOrCreateStripeCustomer(data.client_id, {
      email: client.contact_email || 'contato@example.com',
      name: client.company_name,
      phone: client.contact_phone,
      cpf_cnpj: client.cnpj,
    });

    // Mock subscription creation
    const mockSubscriptionId = `sub_${Date.now()}`;
    const now = new Date();
    const periodEnd = new Date(now);
    
    if (product.billing_interval === 'month') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (product.billing_interval === 'year') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const trialEnd = data.trial_days ? new Date(now.getTime() + data.trial_days * 24 * 60 * 60 * 1000) : undefined;

    const { data: subscription, error } = await supabase
      .from('stripe_subscriptions')
      .insert({
        stripe_subscription_id: mockSubscriptionId,
        stripe_customer_id: stripeCustomer.stripe_customer_id,
        stripe_price_id: product.stripe_price_id!,
        client_id: data.client_id,
        product_id: data.product_id,
        subscription_status: data.trial_days ? 'trialing' : 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_start: data.trial_days ? now.toISOString() : undefined,
        trial_end: trialEnd?.toISOString(),
        amount: product.price_amount,
        currency: product.currency || 'BRL',
        billing_interval: product.billing_interval!,
        discount_percent: data.discount_percent,
      })
      .select()
      .single();

    if (error) throw error;
    return subscription;
  },

  async getClientSubscriptions(clientId: string): Promise<CustomerSubscription[]> {
    const { data: subscriptions, error } = await supabase
      .from('stripe_subscriptions')
      .select(`
        *,
        product:stripe_products(name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (subscriptions || []).map(sub => ({
      id: sub.id,
      stripe_subscription_id: sub.stripe_subscription_id,
      product_name: sub.product?.name || 'Produto não encontrado',
      amount: sub.amount,
      currency: sub.currency || 'BRL',
      status: sub.subscription_status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      trial_end: sub.trial_end,
      next_payment_date: sub.next_payment_date,
      cancel_at_period_end: sub.cancel_at_period_end,
    }));
  },

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { error } = await supabase
      .from('stripe_subscriptions')
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        canceled_at: cancelAtPeriodEnd ? undefined : new Date().toISOString(),
        subscription_status: cancelAtPeriodEnd ? 'active' : 'canceled',
        cancellation_reason: 'customer_request',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  },

  // Payment History
  async getClientPaymentHistory(clientId: string): Promise<PaymentHistory[]> {
    const { data: payments, error } = await supabase
      .from('stripe_payments')
      .select('*')
      .eq('client_id', clientId)
      .order('payment_created_at', { ascending: false });

    if (error) throw error;

    return (payments || []).map(payment => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency || 'BRL',
      status: payment.payment_status,
      payment_method: payment.payment_method || 'N/A',
      description: payment.description || '',
      payment_type: payment.payment_type,
      payment_created_at: payment.payment_created_at,
      payment_confirmed_at: payment.payment_confirmed_at,
      receipt_url: payment.receipt_url,
      boleto_url: payment.boleto_url,
      pix_code: payment.pix_code,
    }));
  },

  // Webhook Processing
  async processWebhookEvent(eventData: {
    id: string;
    type: string;
    data: any;
    api_version: string;
    request_id?: string;
  }): Promise<void> {
    // Store webhook event
    const { error: insertError } = await supabase
      .from('stripe_webhook_events')
      .insert({
        stripe_event_id: eventData.id,
        event_type: eventData.type,
        event_data: eventData.data,
        api_version: eventData.api_version,
        request_id: eventData.request_id,
        event_created_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    // Process specific event types
    try {
      await this.handleWebhookEvent(eventData);
      
      // Mark as processed
      await supabase
        .from('stripe_webhook_events')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('stripe_event_id', eventData.id);

    } catch (error) {
      // Log processing error
      await supabase
        .from('stripe_webhook_events')
        .update({ 
          processing_attempts: 1,
          last_processing_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('stripe_event_id', eventData.id);
      
      throw error;
    }
  },

  async handleWebhookEvent(eventData: { type: string; data: any }): Promise<void> {
    switch (eventData.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(eventData.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(eventData.data.object);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(eventData.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(eventData.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(eventData.data.object);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${eventData.type}`);
    }
  },

  async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    const { error } = await supabase
      .from('stripe_payments')
      .update({
        payment_status: 'succeeded',
        payment_confirmed_at: new Date().toISOString(),
        stripe_charge_id: paymentIntent.charges?.data[0]?.id,
        receipt_url: paymentIntent.charges?.data[0]?.receipt_url,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) throw error;
  },

  async handlePaymentFailed(paymentIntent: any): Promise<void> {
    const { error } = await supabase
      .from('stripe_payments')
      .update({
        payment_status: 'failed',
        payment_failed_at: new Date().toISOString(),
        failure_code: paymentIntent.last_payment_error?.code,
        failure_message: paymentIntent.last_payment_error?.message,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) throw error;
  },

  async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const { error } = await supabase
      .from('stripe_subscriptions')
      .update({
        subscription_status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) throw error;
  },

  async handleSubscriptionCanceled(subscription: any): Promise<void> {
    const { error } = await supabase
      .from('stripe_subscriptions')
      .update({
        subscription_status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) throw error;
  },

  async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    // Handle successful subscription invoice payment
    console.log('Invoice payment succeeded:', invoice.id);
  },

  // Analytics and Reporting
  async getPaymentAnalytics(filters?: {
    start_date?: string;
    end_date?: string;
    payment_type?: string;
  }): Promise<{
    total_revenue: number;
    total_transactions: number;
    successful_payments: number;
    failed_payments: number;
    average_payment_value: number;
    payment_methods_breakdown: Record<string, number>;
  }> {
    let query = supabase
      .from('stripe_payments')
      .select('amount, payment_status, payment_method, payment_type');

    if (filters?.start_date) {
      query = query.gte('payment_created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('payment_created_at', filters.end_date);
    }
    if (filters?.payment_type) {
      query = query.eq('payment_type', filters.payment_type);
    }

    const { data: payments, error } = await query;

    if (error) throw error;

    const analytics = {
      total_revenue: 0,
      total_transactions: payments?.length || 0,
      successful_payments: 0,
      failed_payments: 0,
      average_payment_value: 0,
      payment_methods_breakdown: {} as Record<string, number>,
    };

    if (payments) {
      payments.forEach(payment => {
        if (payment.payment_status === 'succeeded') {
          analytics.total_revenue += payment.amount;
          analytics.successful_payments++;
        } else if (payment.payment_status === 'failed') {
          analytics.failed_payments++;
        }

        // Payment methods breakdown
        const method = payment.payment_method || 'unknown';
        analytics.payment_methods_breakdown[method] = (analytics.payment_methods_breakdown[method] || 0) + 1;
      });

      analytics.average_payment_value = analytics.successful_payments > 0 
        ? analytics.total_revenue / analytics.successful_payments 
        : 0;
    }

    return analytics;
  },

  async getMonthlyRecurringRevenue(): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_mrr');
    
    if (error) throw error;
    return data || 0;
  },

  // Utility Functions
  formatCurrency(amount: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  },

  formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      'card': 'Cartão de Crédito',
      'pix': 'PIX',
      'boleto': 'Boleto Bancário',
      'bank_transfer': 'Transferência Bancária',
    };
    return methods[method] || method;
  },

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'succeeded': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'canceled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  },

  getSubscriptionStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'trialing': return 'text-blue-600';
      case 'past_due': return 'text-orange-600';
      case 'canceled': return 'text-red-600';
      case 'unpaid': return 'text-red-600';
      default: return 'text-gray-600';
    }
  },
};