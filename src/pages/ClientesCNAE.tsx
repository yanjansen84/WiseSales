import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Search, Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useFocus } from "@/context/FocusContext";

interface Cliente {
  id: string;
  nome: string;
  cnpj: string;
  valorComprado: { [mes: string]: number };
  userId: string;
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const ClientesCNAE = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { userId } = useFocus();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(meses[new Date().getMonth()]);
  const [novoCliente, setNovoCliente] = useState({ nome: "", cnpj: "" });
  const [valorComprado, setValorComprado] = useState<string>("");
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "clientesCNAE"),
        where("userId", "==", userId)
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
  }, [userId]);

  const formatarCNPJ = (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    return cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
      const novoClienteData = {
        nome: novoCliente.nome,
        cnpj: formatarCNPJ(cnpjLimpo),
        valorComprado: {},
        userId: userId
      };

      console.log("Salvando cliente:", novoClienteData);
      await addDoc(collection(db, "clientesCNAE"), novoClienteData);

      setNovoCliente({ nome: "", cnpj: "" });
      
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

  const handleValorChange = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, "");
    const valorNumerico = parseInt(apenasNumeros) / 100;
    const valorFormatado = valorNumerico.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    setValorComprado(valorFormatado);
  };

  const atualizarValorComprado = async (clienteId: string) => {
    if (!valorComprado) return;
    
    const valorNumerico = parseFloat(
      valorComprado.replace(/[^\d,]/g, '').replace(',', '.')
    );
    
    if (isNaN(valorNumerico)) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const clienteRef = doc(db, "clientesCNAE", clienteId);
      await updateDoc(clienteRef, {
        [`valorComprado.${mesSelecionado}`]: valorNumerico
      });

      setValorComprado("");
      setClienteSelecionado(null);
      
      toast({
        title: "Valor atualizado",
        description: "Valor atualizado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao atualizar valor:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o valor.",
        variant: "destructive",
      });
    }
  };

  const prepararEditarValor = (clienteId: string, valorAtual: number | undefined) => {
    setClienteSelecionado(clienteId);
    if (valorAtual) {
      setValorComprado(formatarValor(valorAtual));
    } else {
      setValorComprado("");
    }
  };

  const editarCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setNovoCliente({ nome: cliente.nome, cnpj: cliente.cnpj });
  };

  const salvarEdicao = async () => {
    if (!clienteEditando) return;
    
    try {
      await updateDoc(doc(db, "clientesCNAE", clienteEditando.id), {
        nome: novoCliente.nome,
        cnpj: formatarCNPJ(novoCliente.cnpj.replace(/\D/g, "")),
      });
      
      setClienteEditando(null);
      setNovoCliente({ nome: "", cnpj: "" });
      
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

  const cancelarEdicao = () => {
    setClienteEditando(null);
    setNovoCliente({ nome: "", cnpj: "" });
  };

  const excluirCliente = async (id: string) => {
    try {
      await deleteDoc(doc(db, "clientesCNAE", id));
      
      toast({
        title: "Cliente excluído",
        description: "Cliente removido com sucesso.",
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

  return (
    <AppLayout requiredAccess={() => true}>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Clientes CNAE</h1>
        
        {/* Formulário de cadastro */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {clienteEditando ? "Editar Cliente" : "Cadastrar Novo Cliente"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="XX.XXX.XXX/0001-XX"
                  value={novoCliente.cnpj}
                  onChange={(e) => {
                    const cnpj = e.target.value.replace(/\D/g, "").substring(0, 14);
                    setNovoCliente({ ...novoCliente, cnpj: formatarCNPJ(cnpj) });
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              {clienteEditando ? (
                <>
                  <Button variant="outline" onClick={cancelarEdicao}>Cancelar</Button>
                  <Button onClick={salvarEdicao}>Salvar Alterações</Button>
                </>
              ) : (
                <Button onClick={adicionarCliente}>
                  <Plus className="mr-1" size={16} />
                  Adicionar Cliente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Filtro de mês e tabela de clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Controle de Clientes</CardTitle>
            <div className="w-48">
              <Select
                value={mesSelecionado}
                onValueChange={setMesSelecionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes} value={mes}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {clientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-16 h-16 mb-4 rounded-full from-indigo-300 to-purple-300 flex items-center justify-center bg-gray-100">
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-600 text-center max-w-md">
                  Nenhum cliente cadastrado. Adicione seu primeiro cliente usando o formulário acima.
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead className="text-right">Valor Comprado ({mesSelecionado})</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell>{cliente.cnpj}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {clienteSelecionado === cliente.id ? (
                              <>
                                <Input
                                  className="w-32"
                                  placeholder="R$ 0,00"
                                  value={valorComprado}
                                  onChange={(e) => handleValorChange(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      atualizarValorComprado(cliente.id);
                                    }
                                  }}
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => atualizarValorComprado(cliente.id)}
                                >
                                  <DollarSign size={16} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="min-w-[100px] text-right">
                                  {cliente.valorComprado[mesSelecionado] 
                                    ? formatarValor(cliente.valorComprado[mesSelecionado]) 
                                    : "R$ 0,00"}
                                </span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => prepararEditarValor(
                                    cliente.id, 
                                    cliente.valorComprado[mesSelecionado]
                                  )}
                                >
                                  <Edit size={16} />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => editarCliente(cliente)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => excluirCliente(cliente.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ClientesCNAE;
