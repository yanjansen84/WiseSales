import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, CreditCard, User, KeyRound, QrCode, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/user";

interface Usuario {
  nome: string;
  email: string;
  telefone: string;
}

interface AlterarSenha {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

interface PagamentoCartao {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
}

const Configuracoes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [usuario, setUsuario] = useState<Usuario>({
    nome: "",
    email: "",
    telefone: ""
  });

  const [alterarSenha, setAlterarSenha] = useState<AlterarSenha>({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: ""
  });

  const [metodoPagamento, setMetodoPagamento] = useState<"cartao" | "pix">("cartao");
  const [cartao, setCartao] = useState<PagamentoCartao>({
    numero: "",
    nome: "",
    validade: "",
    cvv: ""
  });

  // Simulação de dias restantes (em produção virá do Firebase)
  const diasRestantes = 5;
  const valorPlano = user?.role === UserRole.FOCUS_UNIT ? 20 : 15;
  const statusConta = diasRestantes > 0 ? "teste" : "expirado";

  // Função para formatar número do cartão
  const formatarNumeroCartao = (numero: string) => {
    const apenasNumeros = numero.replace(/\D/g, "");
    return apenasNumeros.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  // Função para formatar validade
  const formatarValidade = (validade: string) => {
    const apenasNumeros = validade.replace(/\D/g, "");
    if (apenasNumeros.length >= 2) {
      return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}`;
    }
    return apenasNumeros;
  };

  // Salvar dados do usuário
  const salvarDados = () => {
    if (!usuario.nome || !usuario.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Integrar com Firebase
    toast({
      title: "Dados salvos",
      description: "Suas informações foram atualizadas com sucesso!",
    });
  };

  // Alterar senha
  const alterarSenhaUsuario = () => {
    if (!alterarSenha.senhaAtual || !alterarSenha.novaSenha || !alterarSenha.confirmarSenha) {
      toast({
        title: "Campos obrigatórios",
        description: "Todos os campos de senha são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (alterarSenha.novaSenha !== alterarSenha.confirmarSenha) {
      toast({
        title: "Senhas diferentes",
        description: "A nova senha e a confirmação não conferem.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Integrar com Firebase
    toast({
      title: "Senha alterada",
      description: "Sua senha foi atualizada com sucesso!",
    });

    setAlterarSenha({
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: ""
    });
  };

  // Função para processar pagamento
  const processarPagamento = () => {
    if (metodoPagamento === "cartao") {
      if (!cartao.numero || !cartao.nome || !cartao.validade || !cartao.cvv) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos do cartão.",
          variant: "destructive",
        });
        return;
      }
    }

    // TODO: Integrar com gateway de pagamento
    toast({
      title: "Pagamento processado",
      description: "Seu pagamento foi processado com sucesso!",
    });
  };

  return (
    <AppLayout requiredAccess={() => true}>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Configurações</h1>

        <Tabs defaultValue="dados" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dados" className="flex items-center gap-2">
              <User size={16} />
              Dados do Usuário
            </TabsTrigger>
            {user?.role !== UserRole.ADMINISTRATOR && (
              <TabsTrigger value="pagamento" className="flex items-center gap-2">
                <CreditCard size={16} />
                Pagamento
              </TabsTrigger>
            )}
          </TabsList>

          {/* Aba de Dados do Usuário */}
          <TabsContent value="dados">
            <div className="grid gap-6">
              {/* Informações Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Suas Informações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        placeholder="Seu nome"
                        value={usuario.nome}
                        onChange={(e) => setUsuario({ ...usuario, nome: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        value={usuario.email}
                        onChange={(e) => setUsuario({ ...usuario, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        placeholder="(00) 00000-0000"
                        value={usuario.telefone}
                        onChange={(e) => setUsuario({ ...usuario, telefone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button onClick={salvarDados}>
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Alterar Senha */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5" />
                    Alterar Senha
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="senhaAtual">Senha Atual</Label>
                      <Input
                        id="senhaAtual"
                        type="password"
                        placeholder="Digite sua senha atual"
                        value={alterarSenha.senhaAtual}
                        onChange={(e) => setAlterarSenha({ ...alterarSenha, senhaAtual: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="novaSenha">Nova Senha</Label>
                      <Input
                        id="novaSenha"
                        type="password"
                        placeholder="Digite a nova senha"
                        value={alterarSenha.novaSenha}
                        onChange={(e) => setAlterarSenha({ ...alterarSenha, novaSenha: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmarSenha"
                        type="password"
                        placeholder="Confirme a nova senha"
                        value={alterarSenha.confirmarSenha}
                        onChange={(e) => setAlterarSenha({ ...alterarSenha, confirmarSenha: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button onClick={alterarSenhaUsuario}>
                      Alterar Senha
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba de Pagamento */}
          {user?.role !== UserRole.ADMINISTRATOR && (
            <TabsContent value="pagamento">
              <div className="grid gap-6">
                {/* Status da Conta */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Status da Conta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statusConta === "teste" ? (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <Clock className="h-5 w-5" />
                          <span>Período de teste: {diasRestantes} dias restantes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-5 w-5" />
                          <span>Período de teste expirado</span>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">Seu plano:</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {user?.role === UserRole.FOCUS_UNIT ? "Foco da Unidade" : "Executivo"}
                        </p>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                          R$ {valorPlano},00<span className="text-sm text-gray-600">/mês</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Método de Pagamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Método de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={metodoPagamento}
                      onValueChange={(value: "cartao" | "pix") => setMetodoPagamento(value)}
                      className="mb-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cartao" id="cartao" />
                        <Label htmlFor="cartao" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Cartão de Crédito
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          PIX
                        </Label>
                      </div>
                    </RadioGroup>

                    {metodoPagamento === "cartao" ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="numero">Número do Cartão</Label>
                            <Input
                              id="numero"
                              placeholder="0000 0000 0000 0000"
                              value={cartao.numero}
                              onChange={(e) => setCartao({ 
                                ...cartao, 
                                numero: formatarNumeroCartao(e.target.value)
                              })}
                              maxLength={19}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="nome">Nome no Cartão</Label>
                            <Input
                              id="nome"
                              placeholder="Nome impresso no cartão"
                              value={cartao.nome}
                              onChange={(e) => setCartao({ ...cartao, nome: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="validade">Validade</Label>
                            <Input
                              id="validade"
                              placeholder="MM/AA"
                              value={cartao.validade}
                              onChange={(e) => setCartao({ 
                                ...cartao, 
                                validade: formatarValidade(e.target.value)
                              })}
                              maxLength={5}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              placeholder="000"
                              value={cartao.cvv}
                              onChange={(e) => setCartao({ 
                                ...cartao, 
                                cvv: e.target.value.replace(/\D/g, "")
                              })}
                              maxLength={3}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-6 rounded-lg text-center">
                          <QrCode className="h-32 w-32 mx-auto text-gray-400" />
                          <p className="mt-4 text-sm text-gray-600">
                            Escaneie o QR Code acima ou copie a chave PIX abaixo
                          </p>
                          <div className="mt-4 bg-white p-3 rounded border">
                            <p className="text-sm font-mono select-all">
                              00020126580014br.gov.bcb.pix0136a629532e-7693-4846-b028-308e65b90399520400005303986540{valorPlano}.005802BR5925WISE SALES TECNOLOGIA6009SAO PAULO62070503***6304D475
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end mt-6">
                      <Button onClick={processarPagamento} className="w-full md:w-auto">
                        Pagar R$ {valorPlano},00
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
