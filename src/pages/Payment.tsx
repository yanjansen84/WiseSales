import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserRole } from "@/types/user";
import { CreditCard, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PaymentStatus as PaymentStatusType } from "@/types/payment";
import { format, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { initMercadoPago, CardPayment, Wallet } from '@mercadopago/sdk-react';
import { mercadoPagoService } from "@/lib/mercadopago";

// Inicializar Mercado Pago SDK
initMercadoPago(mercadoPagoService.getPublicKey());

const AccountStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<{
    isActive: boolean;
    daysLeft: number;
    expiresAt: string | null;
  }>({ isActive: false, daysLeft: 0, expiresAt: null });

  useEffect(() => {
    const fetchStatus = async () => {
      const paymentRef = doc(db, "payments", user!.uid);
      const paymentDoc = await getDoc(paymentRef);
      
      if (paymentDoc.exists()) {
        const data = paymentDoc.data();
        const now = new Date();
        const trialDate = data.trialEndsAt ? parseISO(data.trialEndsAt) : null;
        const subscriptionDate = data.subscriptionEndsAt ? parseISO(data.subscriptionEndsAt) : null;
        
        // Verifica se está no período de teste ou assinatura
        const isInTrial = trialDate && isBefore(now, trialDate);
        const isSubscribed = subscriptionDate && isBefore(now, subscriptionDate);
        
        // Calcula os dias restantes baseado no período ativo
        const targetDate = isInTrial ? trialDate : (isSubscribed ? subscriptionDate : null);
        const daysLeft = targetDate ? 
          Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        setStatus({
          isActive: isInTrial || isSubscribed,
          daysLeft,
          expiresAt: targetDate?.toISOString() || null
        });
      }
    };

    if (user) {
      fetchStatus();
      // Atualiza o status a cada minuto
      const interval = setInterval(fetchStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Status da Conta</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <Badge variant={status.isActive ? "secondary" : "destructive"}>
              {status.isActive ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          {status.isActive && (
            <div className="flex items-center justify-between">
              <span>Dias Restantes:</span>
              <Badge variant={status.daysLeft <= 2 ? "destructive" : "default"}>
                {status.daysLeft} {status.daysLeft === 1 ? "dia" : "dias"}
              </Badge>
            </div>
          )}
          {status.expiresAt && (
            <div className="flex items-center justify-between">
              <span>Expira em:</span>
              <span className="text-sm">
                {format(parseISO(status.expiresAt), "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PaymentStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // Força atualização do componente a cada minuto
      setPaymentStatus(prev => prev ? {...prev} : null);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const paymentRef = doc(db, "payments", user!.uid);
        const paymentDoc = await getDoc(paymentRef);
        const userRef = doc(db, "users", user!.uid);
        const userDoc = await getDoc(userRef);
        
        if (!paymentDoc.exists()) {
          // Criar status inicial com período de teste baseado na data de criação do usuário
          const userCreatedAt = userDoc.data()?.createdAt;
          const createdDate = new Date(userCreatedAt);
          
          // Definir o fim do período de teste para o final do dia (23:59:59) do 7º dia
          const trialEndsAt = new Date(createdDate);
          trialEndsAt.setDate(trialEndsAt.getDate() + 7);
          trialEndsAt.setHours(23, 59, 59, 999);
          
          console.log('Data de criação:', createdDate.toISOString());
          console.log('Data fim do teste:', trialEndsAt.toISOString());
          
          const now = new Date();
          
          const initialStatus: PaymentStatusType = {
            trialEndsAt: trialEndsAt.toISOString(),
            subscriptionEndsAt: null,
            isActive: isBefore(now, trialEndsAt),
            lastPaymentAt: null,
            nextPaymentAt: null,
            amount: user?.role === UserRole.FOCUS_UNIT ? 20 : 15
          };
          await setDoc(paymentRef, initialStatus);
          setPaymentStatus(initialStatus);
        } else {
          const status = paymentDoc.data() as PaymentStatusType;
          console.log('Data fim do teste:', status.trialEndsAt);
          console.log('Data atual:', new Date().toISOString());
          console.log('Diferença em horas:', differenceInHours(parseISO(status.trialEndsAt!), new Date()));
          setPaymentStatus(status);
        }
      } catch (error) {
        console.error("Erro ao buscar status do pagamento:", error);
        toast.error("Erro ao carregar status do pagamento");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPaymentStatus();
    }
  }, [user]);

  if (loading) {
    return (
      <Card className="glass-card mb-6">
        <CardContent className="py-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wise-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isInTrialPeriod = paymentStatus?.trialEndsAt && isBefore(new Date(), parseISO(paymentStatus.trialEndsAt));
  const isSubscriptionActive = paymentStatus?.subscriptionEndsAt && isBefore(new Date(), parseISO(paymentStatus.subscriptionEndsAt));
  
  // Calculando dias restantes de forma mais precisa e atualizando em tempo real
  const now = new Date();
  const daysLeftInTrial = paymentStatus?.trialEndsAt ? 
    Math.ceil((parseISO(paymentStatus.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  console.log('Dias restantes calculados:', daysLeftInTrial);

  return (
    <Card className="glass-card mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {(isInTrialPeriod || isSubscriptionActive) ? (
            <>
              <div className="bg-green-100 p-1.5 rounded-full text-green-700">
                <CheckCircle className="h-4 w-4" />
              </div>
              Status de Pagamento
            </>
          ) : (
            <>
              <div className="bg-red-100 p-1.5 rounded-full text-red-700">
                <AlertCircle className="h-4 w-4" />
              </div>
              Assinatura Expirada
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isInTrialPeriod ? `Período de teste ativo - ${daysLeftInTrial} ${daysLeftInTrial === 1 ? 'dia' : 'dias'} restantes` : 
           isSubscriptionActive ? "Sua assinatura está ativa" : 
           "Sua assinatura expirou"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium">Plano atual</span>
            <span className="text-sm font-medium text-wise-700">
              {isInTrialPeriod ? "Período de Teste" : "Plano Mensal"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium">Valor mensal</span>
            <span className="text-sm font-medium">
              R$ {paymentStatus?.amount.toFixed(2).replace('.', ',')}
            </span>
          </div>
          {isInTrialPeriod ? (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">Término do período de teste</span>
              <span className="text-sm font-medium">
                {format(parseISO(paymentStatus!.trialEndsAt!), "dd 'de' MMMM", { locale: ptBR })}
                {daysLeftInTrial <= 2 && (
                  <span className="ml-2 text-red-600 font-medium">
                    {daysLeftInTrial === 0 ? "Expira hoje!" : 
                     daysLeftInTrial === 1 ? "Expira amanhã!" :
                     "Expira em 2 dias!"}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">
                {isSubscriptionActive ? "Próximo pagamento" : "Assinatura expirada em"}
              </span>
              <span className="text-sm font-medium">
                {paymentStatus?.subscriptionEndsAt && 
                 format(parseISO(paymentStatus.subscriptionEndsAt), "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          )}
          {paymentStatus?.lastPaymentAt && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Último pagamento</span>
              <span className="text-sm font-medium">
                {format(parseISO(paymentStatus.lastPaymentAt), "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">Ver histórico de faturas</Button>
      </CardFooter>
    </Card>
  );
};

const PaymentMethod = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'credit_card' | 'pix'>('credit_card');
  const [cardToken, setCardToken] = useState<string | null>(null);

  const handleCardSubmit = async (formData: any) => {
    try {
      setLoading(true);
      
      // Criar token do cartão
      const cardData = {
        token: formData.token,
        type: 'credit_card' as const
      };

      // Enviar para nossa API
      const response = await fetch('/api/payment/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user!.uid,
          userEmail: user!.email,
          userRole: user!.role,
          paymentMethod: cardData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      toast.success('Pagamento processado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handlePixSubmit = async () => {
    try {
      setLoading(true);

      // Enviar para nossa API
      const response = await fetch('/api/payment/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user!.uid,
          userEmail: user!.email,
          userRole: user!.role,
          paymentMethod: {
            type: 'pix'
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar PIX');
      }

      // Aqui você terá o QR Code e a chave PIX
      toast.success('PIX gerado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  // Obter valor baseado no tipo de usuário
  const getAmount = () => {
    if (!user) return 0;
    return user.role === UserRole.FOCUS_UNIT ? 20 : 15;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Método de Pagamento</CardTitle>
        <CardDescription>
          Escolha como deseja realizar o pagamento
          <Badge variant="outline" className="ml-2">
            R$ {getAmount()},00/mês
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          defaultValue="credit_card"
          className="grid grid-cols-2 gap-4"
          onValueChange={(value) => setPaymentType(value as 'credit_card' | 'pix')}
        >
          <div>
            <RadioGroupItem
              value="credit_card"
              id="credit_card"
              className="peer sr-only"
            />
            <Label
              htmlFor="credit_card"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <CreditCard className="mb-3 h-6 w-6" />
              Cartão de Crédito
            </Label>
          </div>
          <div>
            <RadioGroupItem
              value="pix"
              id="pix"
              className="peer sr-only"
            />
            <Label
              htmlFor="pix"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <svg className="mb-3 h-6 w-6" viewBox="0 0 512 512" fill="currentColor">
                <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.9 231.7 518.9 201.4 488.6L104.3 391.5H119.4C139.4 391.5 158.3 383.7 172.5 369.5L242.4 292.5zM407.7 391.5H392.6C372.6 391.5 353.7 383.7 339.5 369.5L262.5 292.5C257.1 287.1 247.8 287.1 242.4 292.5L172.5 369.5C158.3 383.7 139.4 391.5 119.4 391.5H104.3L201.4 294.4C231.7 264.1 280.3 264.1 310.6 294.4L407.7 391.5zM119.4 120.5H104.3L201.4 23.4C231.7-6.9 280.3-6.9 310.6 23.4L407.7 120.5H392.6C372.6 120.5 353.7 128.3 339.5 142.5L262.5 219.5C257.1 224.9 247.8 224.9 242.4 219.5L172.5 142.5C158.3 128.3 139.4 120.5 119.4 120.5V120.5zM407.7 120.5L310.6 217.6C280.3 247.9 231.7 247.9 201.4 217.6L104.3 120.5H119.4C139.4 120.5 158.3 128.3 172.5 142.5L242.4 219.5C247.8 224.9 257.1 224.9 262.5 219.5L339.5 142.5C353.7 128.3 372.6 120.5 392.6 120.5H407.7z"/>
              </svg>
              PIX
            </Label>
          </div>
        </RadioGroup>

        <div className="mt-6">
          {paymentType === 'credit_card' ? (
            <CardPayment
              initialization={{ amount: getAmount() }}
              onSubmit={handleCardSubmit}
              customization={{
                paymentMethods: {
                  creditCard: 'all',
                  debitCard: 'hidden'
                },
                visual: {
                  style: {
                    theme: 'default'
                  }
                }
              }}
            />
          ) : (
            <div className="space-y-4">
              <Wallet
                initialization={{ preferenceId: '' }}
                customization={{
                  visual: {
                    hidePaymentButton: true
                  }
                }}
              />
              <Button
                className="w-full"
                onClick={handlePixSubmit}
                disabled={loading}
              >
                Gerar QR Code PIX
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const BillingPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState("premium");

  const handleChangePlan = () => {
    toast.success(`Plano alterado para ${selectedPlan === "premium" ? "Premium" : "Básico"}`);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Planos disponíveis</CardTitle>
        <CardDescription>Escolha o plano mais adequado para suas necessidades</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup defaultValue="premium" value={selectedPlan} onValueChange={setSelectedPlan}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-2 border p-4 rounded-lg">
              <RadioGroupItem value="basic" id="basic" />
              <div className="grid gap-1 flex-1">
                <Label htmlFor="basic" className="font-medium">Plano Básico</Label>
                <div className="text-sm text-muted-foreground">
                  Ideal para cinemas menores - R$ 89,90/mês
                </div>
              </div>
              <div className="text-wise-700 font-medium">R$ 89,90</div>
            </div>

            <div className="flex items-center space-x-2 border border-wise-600 bg-wise-50 p-4 rounded-lg">
              <RadioGroupItem value="premium" id="premium" />
              <div className="grid gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="premium" className="font-medium">Plano Premium</Label>
                  <span className="bg-wise-100 text-wise-700 text-xs px-2 py-0.5 rounded-full">Recomendado</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Acesso completo a todas as funcionalidades - R$ 149,90/mês
                </div>
              </div>
              <div className="text-wise-700 font-medium">R$ 149,90</div>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button onClick={handleChangePlan} className="w-full bg-wise-600 hover:bg-wise-700">
          Mudar de plano
        </Button>
      </CardFooter>
    </Card>
  );
};

const Payment = () => {
  const { canAccessPayment, user } = useAuth();

  return (
    <AppLayout requiredAccess={canAccessPayment}>
      <div className="page-container">
        <div className="flex flex-col gap-1 mb-6">
          <span className="text-sm font-medium text-wise-600">Financeiro</span>
          <h1 className="page-title">Pagamento e Assinatura</h1>
          <p className="page-subtitle">
            {user?.role === UserRole.FOCUS_UNIT 
              ? "Gerencie os detalhes de pagamento do seu cinema." 
              : "Gerencie os detalhes de pagamento e assinatura."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AccountStatus />
            <PaymentStatus />
            <PaymentMethod />
          </div>
          
          <div className="lg:col-span-1">
            <BillingPlans />
            
            <Card className="glass-card mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-full text-blue-700">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  Precisa de ajuda?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Se você tiver dúvidas sobre pagamentos ou seu plano, nossa equipe está pronta para ajudar.
                </p>
                <Button variant="outline" className="w-full">
                  Falar com Suporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Payment;
