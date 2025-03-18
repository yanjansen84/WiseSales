import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFocus } from "@/context/FocusContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Search, Plus, Edit, Trash2, DollarSign, Users, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

interface Cliente {
  id: string;
  nome: string;
  cnpj: string;
  valor?: number;
  tipo: "top" | "novo" | "churn";
  mes: string;
  userId: string;
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const ControleClientes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { userId } = useFocus();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(meses[new Date().getMonth()]);
  const [tipoSelecionado, setTipoSelecionado] = useState<"top" | "novo" | "churn">("top");
  const [novoCliente, setNovoCliente] = useState({ nome: "", cnpj: "", valor: "" });
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "controleClientes"),
        where("userId", "==", userId),
        where("mes", "==", mesSelecionado)
      ),
      (snapshot) => {
        const clientesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Cliente));
        setClientes(clientesData);
      }
    );

    return () => unsubscribe();
  }, [userId, mesSelecionado]);

  const formatarCNPJ = (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    return cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const formatarValor = (valor: number) => {
    const valorEmReais = valor / 100;
    return valorEmReais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleValorChange = (valor: string) => {
    // Remove todos os caracteres não numéricos, exceto vírgula e ponto
    let valorLimpo = valor.replace(/[^\d.,]/g, '');
    
    // Substitui pontos por nada (para permitir números como 1.234,56)
    valorLimpo = valorLimpo.replace(/\./g, '');
    
    // Garante que só exista uma vírgula
    const partes = valorLimpo.split(',');
    if (partes.length > 2) {
      valorLimpo = partes[0] + ',' + partes[1];
    }

    // Limita a 2 casas decimais após a vírgula
    if (partes[1]?.length > 2) {
      valorLimpo = partes[0] + ',' + partes[1].slice(0, 2);
    }

    setNovoCliente(prev => ({ ...prev, valor: valorLimpo }));
  };

  const handleCNPJChange = (cnpj: string) => {
    // Remove tudo que não é número
    let cnpjLimpo = cnpj.replace(/\D/g, '');
    
    // Limita a 14 dígitos
    cnpjLimpo = cnpjLimpo.slice(0, 14);
    
    // Aplica a máscara XX.XXX.XXX/XXXX-XX
    let cnpjFormatado = cnpjLimpo;
    if (cnpjLimpo.length > 12) {
      cnpjFormatado = `${cnpjLimpo.slice(0, 2)}.${cnpjLimpo.slice(2, 5)}.${cnpjLimpo.slice(5, 8)}/${cnpjLimpo.slice(8, 12)}-${cnpjLimpo.slice(12)}`;
    } else if (cnpjLimpo.length > 8) {
      cnpjFormatado = `${cnpjLimpo.slice(0, 2)}.${cnpjLimpo.slice(2, 5)}.${cnpjLimpo.slice(5, 8)}/${cnpjLimpo.slice(8)}`;
    } else if (cnpjLimpo.length > 5) {
      cnpjFormatado = `${cnpjLimpo.slice(0, 2)}.${cnpjLimpo.slice(2, 5)}.${cnpjLimpo.slice(5)}`;
    } else if (cnpjLimpo.length > 2) {
      cnpjFormatado = `${cnpjLimpo.slice(0, 2)}.${cnpjLimpo.slice(2)}`;
    }

    setNovoCliente(prev => ({ ...prev, cnpj: cnpjFormatado }));
  };

  const adicionarCliente = async () => {
    if (!userId) return;
    if (!novoCliente.nome.trim() || !novoCliente.cnpj.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e CNPJ do cliente.",
        variant: "destructive",
      });
      return;
    }

    if (tipoSelecionado !== "churn" && !novoCliente.valor) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha o valor para este tipo de cliente.",
        variant: "destructive",
      });
      return;
    }

    const cnpjLimpo = novoCliente.cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "O CNPJ deve conter 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const valorNumerico = tipoSelecionado === "churn" ? 0 : 
        parseFloat(novoCliente.valor.replace(/[^\d,]/g, '').replace(',', '.')) * 100;

      const novoClienteData = {
        nome: novoCliente.nome,
        cnpj: formatarCNPJ(cnpjLimpo),
        valor: valorNumerico,
        tipo: tipoSelecionado,
        mes: mesSelecionado,
        userId: userId
      };

      await addDoc(collection(db, "controleClientes"), novoClienteData);

      setNovoCliente({ nome: "", cnpj: "", valor: "" });
      
      toast({
        title: "Cliente adicionado",
        description: "Cliente cadastrado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao adicionar:", error);
      toast({
        title: "Erro ao adicionar",
        description: "Ocorreu um erro ao cadastrar o cliente.",
        variant: "destructive",
      });
    }
  };

  const editarCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setNovoCliente({ 
      nome: cliente.nome, 
      cnpj: cliente.cnpj,
      valor: (cliente.valor || 0) / 100 + ',00'
    });
    setTipoSelecionado(cliente.tipo);
  };

  const salvarEdicao = async () => {
    if (!clienteEditando) return;
    
    try {
      const valorNumerico = tipoSelecionado === "churn" ? 0 : 
        parseFloat(novoCliente.valor.replace(/[^\d,]/g, '').replace(',', '.')) * 100;

      await updateDoc(doc(db, "controleClientes", clienteEditando.id), {
        nome: novoCliente.nome,
        cnpj: formatarCNPJ(novoCliente.cnpj.replace(/\D/g, "")),
        valor: valorNumerico
      });
      
      setClienteEditando(null);
      setNovoCliente({ nome: "", cnpj: "", valor: "" });
      
      toast({
        title: "Cliente atualizado",
        description: "Dados do cliente atualizados com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o cliente.",
        variant: "destructive",
      });
    }
  };

  const excluirCliente = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      await deleteDoc(doc(db, "controleClientes", id));
      toast({
        title: "Cliente excluído",
        description: "Cliente excluído com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o cliente.",
        variant: "destructive",
      });
    }
  };

  const getClientesFiltrados = () => {
    return clientes.filter(cliente => cliente.tipo === tipoSelecionado)
      .sort((a, b) => (b.valor || 0) - (a.valor || 0));
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Controle de Clientes</h1>
            <p className="text-gray-600">Gestão mensal de clientes</p>
          </div>
          
          <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {meses.map((mes, index) => (
                <SelectItem key={index} value={mes}>
                  {mes}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tipoSelecionado} onValueChange={(value: "top" | "novo" | "churn") => setTipoSelecionado(value)}>
          <TabsList className="mb-6">
            <TabsTrigger value="top" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top 10 Clientes
            </TabsTrigger>
            <TabsTrigger value="novo" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Clientes Novos
            </TabsTrigger>
            <TabsTrigger value="churn" className="flex items-center gap-2">
              <UserMinus className="h-4 w-4" />
              Clientes Churn
            </TabsTrigger>
          </TabsList>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    placeholder="Nome do cliente"
                    value={novoCliente.nome}
                    onChange={(e) => setNovoCliente(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    placeholder="XX.XXX.XXX/XXXX-XX"
                    value={novoCliente.cnpj}
                    onChange={(e) => handleCNPJChange(e.target.value)}
                    maxLength={18}
                  />
                </div>
                {tipoSelecionado !== "churn" && (
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor</Label>
                    <Input
                      id="valor"
                      placeholder="R$ 0,00"
                      value={novoCliente.valor}
                      onChange={(e) => handleValorChange(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                {clienteEditando ? (
                  <>
                    <Button variant="outline" className="mr-2" onClick={() => {
                      setClienteEditando(null);
                      setNovoCliente({ nome: "", cnpj: "", valor: "" });
                    }}>
                      Cancelar
                    </Button>
                    <Button onClick={salvarEdicao}>
                      Salvar Alterações
                    </Button>
                  </>
                ) : (
                  <Button onClick={adicionarCliente}>
                    Adicionar Cliente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <TabsContent value={tipoSelecionado} className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      {tipoSelecionado !== "churn" && <TableHead>Valor</TableHead>}
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getClientesFiltrados().map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>{cliente.nome}</TableCell>
                        <TableCell>{cliente.cnpj}</TableCell>
                        {tipoSelecionado !== "churn" && (
                          <TableCell>{formatarValor(cliente.valor || 0)}</TableCell>
                        )}
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => editarCliente(cliente)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => excluirCliente(cliente.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ControleClientes;
