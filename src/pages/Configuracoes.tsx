import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, CreditCard, User, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Payment } from "@/components/configuracoes/assinatura/Payment";

const Configuracoes = () => {
  const { toast } = useToast();
  const { user, updatePassword, isLoading: authLoading } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [usuario, setUsuario] = useState({
    nome: "",
    email: "",
    telefone: ""
  });

  const [alterarSenha, setAlterarSenha] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: ""
  });

  const handleSalvarPerfil = () => {
    // Implementar lógica para salvar perfil
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram atualizadas com sucesso."
    });
  };

  const handleAlterarSenha = async () => {
    if (alterarSenha.novaSenha !== alterarSenha.confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (alterarSenha.novaSenha.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUpdating(true);
      await updatePassword(alterarSenha.senhaAtual, alterarSenha.novaSenha);
      
      setAlterarSenha({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: ""
      });

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!"
      });
    } catch (error) {
      // O AuthContext já trata os erros e exibe toast
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e configurações da conta
          </p>
        </div>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList>
            <TabsTrigger value="perfil">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="assinatura">
              <CreditCard className="h-4 w-4 mr-2" />
              Assinatura
            </TabsTrigger>
            <TabsTrigger value="senha">
              <KeyRound className="h-4 w-4 mr-2" />
              Senha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <Card>
              <CardHeader>
                <CardTitle>Suas Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      placeholder="Seu nome"
                      value={usuario.nome}
                      onChange={(e) => setUsuario({ ...usuario, nome: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.email@exemplo.com"
                      value={usuario.email}
                      onChange={(e) => setUsuario({ ...usuario, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      placeholder="(00) 00000-0000"
                      value={usuario.telefone}
                      onChange={(e) => setUsuario({ ...usuario, telefone: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSalvarPerfil}>Salvar Alterações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assinatura">
            <Payment />
          </TabsContent>

          <TabsContent value="senha">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="senhaAtual">Senha Atual</Label>
                    <Input
                      id="senhaAtual"
                      type="password"
                      placeholder="Digite sua senha atual"
                      value={alterarSenha.senhaAtual}
                      onChange={(e) => setAlterarSenha({ ...alterarSenha, senhaAtual: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="novaSenha">Nova Senha</Label>
                    <Input
                      id="novaSenha"
                      type="password"
                      placeholder="Digite a nova senha (mínimo 6 caracteres)"
                      value={alterarSenha.novaSenha}
                      onChange={(e) => setAlterarSenha({ ...alterarSenha, novaSenha: e.target.value })}
                    />
                    {alterarSenha.novaSenha.length > 0 && alterarSenha.novaSenha.length < 6 && (
                      <p className="text-sm text-destructive">
                        A senha deve ter no mínimo 6 caracteres
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
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
                <Button 
                  onClick={handleAlterarSenha}
                  disabled={isUpdating || authLoading}
                >
                  {isUpdating ? "Alterando..." : "Alterar Senha"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
