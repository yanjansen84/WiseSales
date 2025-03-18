export interface MercadoPagoConfig {
  publicKey: string;
  accessToken: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  currency_id: string;
  payment_type: 'credit_card' | 'pix';
  status: 'active' | 'inactive';
  trial_period_days: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'credit_card' | 'pix';
  status: 'active' | 'pending' | 'rejected';
  external_reference?: string;
}

export interface SubscriptionStatus {
  id: string;
  status: 'authorized' | 'pending' | 'cancelled' | 'paused' | 'expired';
  payer_email: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  next_payment_date?: string;
  payment_method_id: string;
}
