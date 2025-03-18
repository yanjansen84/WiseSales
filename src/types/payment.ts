export interface PaymentStatus {
  trialEndsAt: string | null; // Data de término do período de teste
  subscriptionEndsAt: string | null; // Data de término da assinatura
  isActive: boolean; // Se a assinatura está ativa
  lastPaymentAt: string | null; // Data do último pagamento
  nextPaymentAt: string | null; // Data do próximo pagamento
  amount: number; // Valor do plano (15 para Executivo, 20 para Foco)
}

export interface CardPayment {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
}
