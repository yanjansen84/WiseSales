import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FolderKanban, Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";

interface Projeto {
  id: string;
  nome: string;
  cnpj: string;
  valor: number;
  mes: string;
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const Projetos = () => {
  const { toast } = useToast();
  const auth = getAuth();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(meses[new Date().getMonth()]);
  const [novoProjeto, setNovoProjeto] = useState({ nome: "", cnpj: "", valor: "" });
  const [projetoEditando, setProjetoEditando] = useState<Projeto | null>(null);

  // Carregar projetos do Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "projetos"),
        where("userId", "==", auth.currentUser.uid)
      ),
      (snapshot) => {
        const projetosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Projeto));
        setProjetos(projetosData);
      }
    );

    return () => unsubscribe();
  }, []);

  // Formatar CNPJ (XX.XXX.XXX/0001-XX)
  const formatarCNPJ = (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    return cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  // Formatar valor monetário
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Adicionar novo projeto
  const adicionarProjeto = async () => {
    if (!auth.currentUser) return;
    if (!novoProjeto.nome.trim() || !novoProjeto.cnpj.trim() || !novoProjeto.valor) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos do projeto.",
        variant: "destructive",
      });
      return;
    }

    const cnpjLimpo = novoProjeto.cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "O CNPJ deve conter 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    const valorNumerico = parseFloat(novoProjeto.valor.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(valorNumerico)) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const novoProjetoData = {
        nome: novoProjeto.nome,
        cnpj: formatarCNPJ(cnpjLimpo),
        valor: valorNumerico,
        mes: mesSelecionado,
        userId: auth.currentUser.uid
      };
      
      console.log("Salvando projeto:", novoProjetoData);
      await addDoc(collection(db, "projetos"), novoProjetoData);

      setNovoProjeto({ nome: "", cnpj: "", valor: "" });
      
      toast({
        title: "Projeto adicionado",
        description: "Projeto cadastrado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao adicionar:", error);
      toast({
        title: "Erro ao adicionar",
        description: "Ocorreu um erro ao cadastrar o projeto.",
        variant: "destructive",
      });
    }
  };

  // Iniciar edição de projeto
  const editarProjeto = (projeto: Projeto) => {
    setProjetoEditando(projeto);
    setNovoProjeto({ 
      nome: projeto.nome, 
      cnpj: projeto.cnpj,
      valor: formatarValor(projeto.valor).replace('R$', '').trim()
    });
  };

  // Salvar projeto editado
  const salvarEdicao = async () => {
    if (!projetoEditando) return;

    const valorNumerico = parseFloat(novoProjeto.valor.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(valorNumerico)) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
      return;
    }
    
    if (!projetoEditando) return;
    
    try {
      await updateDoc(doc(db, "projetos", projetoEditando.id), {
        nome: novoProjeto.nome,
        cnpj: formatarCNPJ(novoProjeto.cnpj.replace(/\D/g, "")),
        valor: valorNumerico,
      });
      
      setProjetoEditando(null);
      setNovoProjeto({ nome: "", cnpj: "", valor: "" });
      
      toast({
        title: "Projeto atualizado",
        description: "Dados do projeto atualizados com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o projeto.",
        variant: "destructive",
      });
    }
  };

  // Cancelar edição
  const cancelarEdicao = () => {
    setProjetoEditando(null);
    setNovoProjeto({ nome: "", cnpj: "", valor: "" });
  };

  // Excluir projeto
  const excluirProjeto = async (id: string) => {
    try {
      await deleteDoc(doc(db, "projetos", id));
      
      toast({
        title: "Projeto excluído",
        description: "Projeto removido com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o projeto.",
        variant: "destructive",
      });
    }
  };

  // Formatar input de valor monetário
  const handleValorChange = (valor: string) => {
    setNovoProjeto(prev => ({ ...prev, valor }));
  };

  // Filtrar projetos pelo mês selecionado
  const projetosFiltrados = projetos.filter(projeto => projeto.mes === mesSelecionado);

  return (
    <AppLayout requiredAccess={() => true}>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Projetos</h1>
        
        {/* Formulário de cadastro/edição */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {projetoEditando ? "Editar Projeto" : "Cadastrar Novo Projeto"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Cliente</Label>
                <Input
                  id="nome"
                  placeholder="Nome do cliente"
                  value={novoProjeto.nome}
                  onChange={(e) => setNovoProjeto({ ...novoProjeto, nome: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="XX.XXX.XXX/0001-XX"
                  value={novoProjeto.cnpj}
                  onChange={(e) => {
                    const cnpj = e.target.value.replace(/\D/g, "").substring(0, 14);
                    setNovoProjeto({ ...novoProjeto, cnpj: formatarCNPJ(cnpj) });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="valor">Valor do Projeto</Label>
                <Input
                  id="valor"
                  placeholder="R$ 0,00"
                  value={novoProjeto.valor}
                  onChange={(e) => handleValorChange(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              {projetoEditando ? (
                <>
                  <Button variant="outline" onClick={cancelarEdicao}>Cancelar</Button>
                  <Button onClick={salvarEdicao}>Salvar Alterações</Button>
                </>
              ) : (
                <Button onClick={adicionarProjeto}>
                  <Plus className="mr-1" size={16} />
                  Adicionar Projeto
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Filtro de mês e tabela de projetos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Lista de Projetos</CardTitle>
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
            {projetosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-16 h-16 mb-4 rounded-full from-indigo-300 to-purple-300 flex items-center justify-center bg-gray-100">
                  <FolderKanban className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-600 text-center max-w-md">
                  Nenhum projeto cadastrado para {mesSelecionado}. Adicione seu primeiro projeto usando o formulário acima.
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead className="text-right">Valor do Projeto</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projetosFiltrados.map((projeto) => (
                      <TableRow key={projeto.id}>
                        <TableCell className="font-medium">{projeto.nome}</TableCell>
                        <TableCell>{projeto.cnpj}</TableCell>
                        <TableCell className="text-right">
                          {formatarValor(projeto.valor)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => editarProjeto(projeto)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => excluirProjeto(projeto.id)}
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

export default Projetos;
