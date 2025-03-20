import { MercadoPagoConfig, SubscriptionPlan, PaymentMethod, SubscriptionStatus } from "@/types/mercadopago";
import { UserRole } from "@/types/user";

const PLANS = {
  [UserRole.SALES_EXECUTIVE]: {
    name: "Plano Executivo",
    amount: 15.00,
    trial_period_days: 7
  },
  [UserRole.FOCUS_UNIT]: {
    name: "Plano Foco da Unidade",
    amount: 20.00,
    trial_period_days: 7
  }
};

class MercadoPagoService {
  private config: MercadoPagoConfig;

  constructor() {
    this.config = {
      publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!,
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
    };
  }

  async createSubscriptionPlan(userRole: UserRole): Promise<SubscriptionPlan> {
    if (userRole === UserRole.ADMINISTRATOR) {
      throw new Error("Administradores não precisam de assinatura");
    }

    const plan = PLANS[userRole];
    if (!plan) {
      throw new Error("Tipo de usuário inválido para assinatura");
    }
    
    const response = await fetch("https://api.mercadopago.com/preapproval_plan", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        back_url: "https://seu-dominio.com/payment/callback",
        reason: plan.name,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: plan.amount,
          currency_id: "BRL"
        },
        payment_methods_allowed: {
          payment_types: [
            { id: "credit_card" },
            { id: "pix" }
          ]
        },
        status: "active"
      })
    });

    return response.json();
  }

  async createSubscription(planId: string, userEmail: string, paymentMethod: PaymentMethod): Promise<SubscriptionStatus> {
    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        preapproval_plan_id: planId,
        payer_email: userEmail,
        payment_method_id: paymentMethod.id,
        status: "authorized",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          start_date: new Date().toISOString(),
          end_date: null
        }
      })
    });

    return response.json();
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatus> {
    const response = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      headers: {
        "Authorization": `Bearer ${this.config.accessToken}`
      }
    });

    return response.json();
  }

  async createPaymentMethod(cardToken: string, userEmail: string): Promise<PaymentMethod> {
    const response = await fetch("https://api.mercadopago.com/v1/customers/cards", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: cardToken,
        email: userEmail
      })
    });

    return response.json();
  }

  getPublicKey(): string {
    return this.config.publicKey;
  }

  async createPreference(preference: any) {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preference)
    });

    if (!response.ok) {
      throw new Error('Erro ao criar preferência no Mercado Pago');
    }

    return response.json();
  }

  async getPayment(paymentId: string) {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${this.config.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar pagamento no Mercado Pago');
    }

    return response.json();
  }
}

export const mercadoPagoService = new MercadoPagoService();
