import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { mercadoPagoService } from "@/lib/mercadopago";
import { addDays } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Verificar se é uma notificação de assinatura
    if (data.type !== "subscription") {
      return NextResponse.json({ message: "Notificação ignorada" });
    }

    // Buscar detalhes da assinatura
    const subscription = await mercadoPagoService.getSubscriptionStatus(data.data.id);
    
    // Buscar documento de pagamento pelo subscriptionId
    const paymentsRef = collection(db, "payments");
    const q = query(paymentsRef, where("subscriptionId", "==", subscription.id));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Assinatura não encontrada");
    }

    const paymentDoc = querySnapshot.docs[0];
    const now = new Date();

    // Atualizar status baseado na notificação
    switch (subscription.status) {
      case "authorized": {
        // Pagamento aprovado, renovar assinatura
        const subscriptionEndsAt = addDays(now, 30);
        await updateDoc(paymentDoc.ref, {
          subscriptionEndsAt: subscriptionEndsAt.toISOString(),
          isActive: true,
          lastPaymentAt: now.toISOString(),
          nextPaymentAt: subscriptionEndsAt.toISOString(),
          status: subscription.status
        });
        break;
      }
      
      case "cancelled":
      case "expired": {
        // Assinatura cancelada ou expirada
        await updateDoc(paymentDoc.ref, {
          isActive: false,
          status: subscription.status,
          subscriptionEndsAt: now.toISOString()
        });
        break;
      }
      
      case "pending": {
        // Aguardando pagamento (ex: PIX gerado)
        await updateDoc(paymentDoc.ref, {
          status: subscription.status
        });
        break;
      }

      case "paused": {
        // Assinatura pausada
        await updateDoc(paymentDoc.ref, {
          isActive: false,
          status: subscription.status
        });
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json({
      error: error.message || "Erro ao processar webhook"
    }, { status: 500 });
  }
}
