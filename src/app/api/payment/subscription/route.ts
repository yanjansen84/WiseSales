import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { mercadoPagoService } from "@/lib/mercadopago";
import { PaymentMethod, SubscriptionStatus } from "@/types/mercadopago";
import { addDays } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, userRole, paymentMethod } = await request.json();

    // Verificar se já existe uma assinatura ativa
    const paymentRef = doc(db, "payments", userId);
    const paymentDoc = await getDoc(paymentRef);

    if (paymentDoc.exists()) {
      const data = paymentDoc.data();
      const now = new Date();
      const trialEndsAt = data.trialEndsAt ? new Date(data.trialEndsAt) : null;
      const subscriptionEndsAt = data.subscriptionEndsAt ? new Date(data.subscriptionEndsAt) : null;

      // Se ainda estiver no período de teste ou com assinatura ativa, não criar nova assinatura
      if ((trialEndsAt && now < trialEndsAt) || (subscriptionEndsAt && now < subscriptionEndsAt)) {
        return NextResponse.json({
          error: "Usuário já possui período de teste ou assinatura ativa"
        }, { status: 400 });
      }
    }

    // Criar plano de assinatura (ou usar um existente)
    const plan = await mercadoPagoService.createSubscriptionPlan(userRole);

    // Criar método de pagamento
    let paymentMethodResponse: PaymentMethod;
    if (paymentMethod.type === "credit_card") {
      paymentMethodResponse = await mercadoPagoService.createPaymentMethod(
        paymentMethod.token,
        userEmail
      );
    } else {
      // Para PIX, criar um método de pagamento temporário
      paymentMethodResponse = {
        id: `pix_${Date.now()}`,
        name: "PIX",
        type: "pix",
        status: "pending"
      };
    }

    // Criar assinatura
    const subscription = await mercadoPagoService.createSubscription(
      plan.id,
      userEmail,
      paymentMethodResponse
    );

    // Atualizar status no Firestore
    const now = new Date();
    const subscriptionEndsAt = addDays(now, 30); // 30 dias de assinatura

    await setDoc(paymentRef, {
      trialEndsAt: null,
      subscriptionEndsAt: subscriptionEndsAt.toISOString(),
      isActive: true,
      lastPaymentAt: now.toISOString(),
      nextPaymentAt: subscriptionEndsAt.toISOString(),
      amount: plan.amount,
      subscriptionId: subscription.id,
      paymentMethodId: paymentMethodResponse.id,
      status: subscription.status
    });

    return NextResponse.json({
      success: true,
      subscription,
      paymentMethod: paymentMethodResponse
    });
  } catch (error: any) {
    console.error("Erro ao processar assinatura:", error);
    return NextResponse.json({
      error: error.message || "Erro ao processar assinatura"
    }, { status: 500 });
  }
}
