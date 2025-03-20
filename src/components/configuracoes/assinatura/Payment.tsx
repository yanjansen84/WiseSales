import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PaymentStatus as PaymentStatusType } from "@/types/payment";
import { UserRole } from "@/types/user";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Payment() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        if (!user) return;
        
        const paymentRef = doc(db, "payments", user.uid);
        const paymentDoc = await getDoc(paymentRef);
        
        if (paymentDoc.exists()) {
          setPaymentStatus(paymentDoc.data() as PaymentStatusType);
        }
      } catch (error) {
        console.error("Erro ao buscar status do pagamento:", error);
        toast.error("Erro ao carregar status do pagamento");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [user]);

  const getStatusInfo = () => {
    const now = new Date();
    let daysLeft = 0;
    let statusText = "Inativo";
    let variant: "default" | "destructive" | "secondary" | "outline" = "destructive";

    if (paymentStatus?.trialEndsAt) {
      const trialEnd = parseISO(paymentStatus.trialEndsAt);
      if (trialEnd > now) {
        daysLeft = differenceInDays(trialEnd, now);
        statusText = "Período de Teste";
        variant = "secondary";
      }
    }

    if (paymentStatus?.subscriptionEndsAt) {
      const subscriptionEnd = parseISO(paymentStatus.subscriptionEndsAt);
      if (subscriptionEnd > now) {
        daysLeft = differenceInDays(subscriptionEnd, now);
        statusText = "Ativo";
        variant = "default";
      }
    }

    return { daysLeft, statusText, variant };
  };

  const handlePayment = async () => {
    try {
      setRedirecting(true);
      const response = await fetch('http://localhost:8080/api/payment/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid,
          amount: user?.role === UserRole.FOCUS_UNIT ? 20 : 15
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar preferência de pagamento');
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao redirecionar para o pagamento');
      setRedirecting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wise-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status da Assinatura</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Status atual */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <Badge variant={statusInfo.variant}>
                {statusInfo.statusText}
              </Badge>
            </div>
            {statusInfo.daysLeft > 0 && (
              <Badge variant={statusInfo.daysLeft <= 5 ? "destructive" : "outline"}>
                {statusInfo.daysLeft} {statusInfo.daysLeft === 1 ? "dia restante" : "dias restantes"}
              </Badge>
            )}
          </div>

          {/* Valor da assinatura */}
          <div className="flex items-center justify-between">
            <span>Valor da Assinatura:</span>
            <span className="font-medium">
              R$ {user?.role === UserRole.FOCUS_UNIT ? "20,00" : "15,00"}/mês
            </span>
          </div>
        </div>

        {/* Botão de pagamento */}
        <Button
          onClick={handlePayment}
          className="w-full"
          disabled={redirecting}
        >
          {redirecting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            'Realizar Pagamento'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
