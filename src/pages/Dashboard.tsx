import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFocus } from "@/context/FocusContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from "@/types/user";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line } from "recharts";
import { DollarSign, TrendingUp, Building2, TreeDeciduous, Users, FolderKanban } from "lucide-react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { FocusSelector } from "@/components/FocusSelector";

interface Projeto {
  id: string;
  nome: string;
  valor: number;
  mes: string;
  userId: string;
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const mesAtual = new Date().getMonth();

// Função para formatar valores monetários (R$ XX.XXX,XX)
const formatarValorBRL = (valor: number) => {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const KPICard = ({ title, value, description, icon }: { title: string; value: string; description: string; icon: React.ReactNode }) => (
  <Card className="bg-white">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const ClientesList = ({ title, clientes, icon, redirectTo }: { 
  title: string; 
  clientes: { nome: string; valor: number }[]; 
  icon: React.ReactNode;
  redirectTo: string;
}) => {
  const navigate = useNavigate();
  const temMaisClientes = clientes.length > 5;
  const clientesExibidos = clientes.slice(0, 5);

  return (
    <Card className="bg-white h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {clientesExibidos.map((cliente, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b">
              <span className="font-medium text-gray-700 truncate max-w-[180px]" title={cliente.nome}>
                {cliente.nome}
              </span>
              <span className="font-semibold text-green-600 ml-2">
                {formatarValorBRL(cliente.valor)}
              </span>
            </div>
          ))}
          {temMaisClientes && (
            <button
              onClick={() => navigate(redirectTo)}
              className="w-full py-2 text-sm font-medium text-green-600 hover:text-green-700 text-center border-t"
            >
              Ver mais
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ClientesCard = ({ 
  topClientes, 
  clientesNovos, 
  clientesChurn 
}: { 
  topClientes: any[]; 
  clientesNovos: any[]; 
  clientesChurn: any[]; 
}) => {
  const navigate = useNavigate();

  const renderLista = (clientes: any[], showValue: boolean = true) => {
    const temMaisClientes = clientes.length > 5;
    const clientesExibidos = clientes.slice(0, 5);

    return (
      <div className="space-y-4">
        {clientesExibidos.map((cliente, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b">
            <span className="font-medium text-gray-700 truncate max-w-[180px]" title={cliente.nome}>
              {cliente.nome}
            </span>
            {showValue ? (
              <span className="font-semibold text-green-600 ml-2">
                {formatarValorBRL(cliente.valor)}
              </span>
            ) : (
              <span className="font-semibold text-gray-600 ml-2 truncate max-w-[120px]" title={cliente.cnpj}>
                {cliente.cnpj}
              </span>
            )}
          </div>
        ))}
        {temMaisClientes && (
          <button
            onClick={() => navigate("/controle-clientes")}
            className="w-full py-2 text-sm font-medium text-green-600 hover:text-green-700 text-center border-t"
          >
            Ver mais
          </button>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-white h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Controle de Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <Tabs defaultValue="top" className="w-full">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="top">Top 10</TabsTrigger>
            <TabsTrigger value="novos">Novos</TabsTrigger>
            <TabsTrigger value="churn">Churn</TabsTrigger>
          </TabsList>
          <TabsContent value="top">
            {renderLista(topClientes)}
          </TabsContent>
          <TabsContent value="novos">
            {renderLista(clientesNovos)}
          </TabsContent>
          <TabsContent value="churn">
            {renderLista(clientesChurn, false)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { userId } = useFocus();
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual.toString());
  const [evolucaoVendas, setEvolucaoVendas] = useState<any[]>([]);
  const [clientesCNAE, setClientesCNAE] = useState<any[]>([]);
  const [clientesSigaVerde, setClientesSigaVerde] = useState<any[]>([]);
  const [totalVendas, setTotalVendas] = useState(0);
  const [ticketMedioCNAE, setTicketMedioCNAE] = useState(0);
  const [ticketMedioSigaVerde, setTicketMedioSigaVerde] = useState(0);
  const [topClientes, setTopClientes] = useState<any[]>([]);
  const [clientesNovos, setClientesNovos] = useState<any[]>([]);
  const [clientesChurn, setClientesChurn] = useState<any[]>([]);
  const [totalProjetos, setTotalProjetos] = useState(0);

  useEffect(() => {
    if (!auth.currentUser?.uid || !userId) return;

    // Carregar dados dos Projetos (valores já estão em reais no banco)
    const unsubscribeProjetos = onSnapshot(
      query(
        collection(db, "projetos"),
        where("userId", "==", userId),
        where("mes", "==", meses[parseInt(mesSelecionado)])
      ),
      (snapshot) => {
        try {
          const projetos = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as Projeto));
          
          const totalMesAtual = projetos.reduce((acc, projeto) => {
            return acc + Number(projeto.valor || 0);
          }, 0);
          
          setTotalProjetos(totalMesAtual);
        } catch (error) {
          console.error("Erro ao processar dados dos projetos:", error);
          setTotalProjetos(0);
        }
      }
    );

    // Carregar clientes CNAE
    const unsubscribeCNAE = onSnapshot(
      query(
        collection(db, "clientesCNAE"),
        where("userId", "==", userId)
      ),
      (snapshot) => {
        try {
          const clientes = snapshot.docs.map(doc => ({
            nome: doc.data().nome,
            valor: (doc.data().valorComprado?.[meses[parseInt(mesSelecionado)]] || 0)
          })).filter(cliente => cliente.valor > 0);
          setClientesCNAE(clientes);
          setTicketMedioCNAE(clientes.length > 0 
            ? clientes.reduce((acc, curr) => acc + curr.valor, 0) / clientes.length 
            : 0
          );
        } catch (error) {
          console.error("Erro ao processar dados dos clientes CNAE:", error);
          setClientesCNAE([]);
          setTicketMedioCNAE(0);
        }
      }
    );

    // Carregar clientes Siga Verde
    const unsubscribeSigaVerde = onSnapshot(
      query(
        collection(db, "clientesSigaVerde"),
        where("userId", "==", userId)
      ),
      (snapshot) => {
        try {
          const clientes = snapshot.docs.map(doc => ({
            nome: doc.data().nome,
            valor: (doc.data().valorComprado?.[meses[parseInt(mesSelecionado)]] || 0)
          })).filter(cliente => cliente.valor > 0);
          setClientesSigaVerde(clientes);
          setTicketMedioSigaVerde(clientes.length > 0 
            ? clientes.reduce((acc, curr) => acc + curr.valor, 0) / clientes.length 
            : 0
          );
        } catch (error) {
          console.error("Erro ao processar dados dos clientes Siga Verde:", error);
          setClientesSigaVerde([]);
          setTicketMedioSigaVerde(0);
        }
      }
    );

    // Carregar total de vendas
    const unsubscribeVendas = onSnapshot(
      query(
        collection(db, "segmentos"),
        where("userId", "==", userId)
      ),
      (snapshot) => {
        try {
          const segmentos = snapshot.docs.map(doc => doc.data());
          const totalMesAtual = segmentos.reduce((acc, segmento) => 
            acc + (segmento.realizado?.[meses[parseInt(mesSelecionado)]] || 0), 0
          );
          setTotalVendas(totalMesAtual / 100);
        } catch (error) {
          console.error("Erro ao processar dados das vendas:", error);
          setTotalVendas(0);
        }
      }
    );

    // Carregar dados do Controle de Clientes
    const unsubscribeControleClientes = onSnapshot(
      query(
        collection(db, "controleClientes"),
        where("userId", "==", userId),
        where("mes", "==", meses[parseInt(mesSelecionado)])
      ),
      (snapshot) => {
        const clientes = snapshot.docs.map(doc => ({
          nome: doc.data().nome,
          cnpj: doc.data().cnpj,
          valor: (doc.data().valor || 0) / 100,
          tipo: doc.data().tipo
        }));

        // Filtrar por tipo
        setTopClientes(clientes.filter(c => c.tipo === "top").sort((a, b) => b.valor - a.valor));
        setClientesNovos(clientes.filter(c => c.tipo === "novo"));
        setClientesChurn(clientes.filter(c => c.tipo === "churn"));
      }
    );

    // Calcular evolução de vendas
    const calcularEvolucaoVendas = async () => {
      const segmentosSnapshot = await getDocs(query(
        collection(db, "segmentos"),
        where("userId", "==", userId)
      ));

      const segmentos = segmentosSnapshot.docs.map(doc => doc.data());

      const evolucao = meses.map((mes, index) => {
        const valorTotal = segmentos.reduce((acc, segmento) => 
          acc + (segmento.realizado?.[mes] || 0), 0
        );

        return {
          mes: mes.substring(0, 3),
          valor: valorTotal / 100,
          tendencia: 0
        };
      });

      // Calcular linha de tendência usando média móvel simples
      const valores = evolucao.map(e => e.valor);
      const mediaMovel = valores.map((_, index) => {
        if (index < 2) return valores[index];
        const soma = valores.slice(index - 2, index + 1).reduce((a, b) => a + b, 0);
        return soma / 3;
      });

      evolucao.forEach((e, i) => {
        e.tendencia = mediaMovel[i];
      });

      setEvolucaoVendas(evolucao);
    };

    calcularEvolucaoVendas();

    return () => {
      unsubscribeProjetos();
      unsubscribeCNAE();
      unsubscribeSigaVerde();
      unsubscribeVendas();
      unsubscribeControleClientes();
    };
  }, [userId, mesSelecionado]);

  return (
    <AppLayout requiredAccess={() => true}>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-4">
            <FocusSelector />
            <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {meses.map((mes, index) => (
                  <SelectItem key={mes} value={index.toString()}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total de Vendas</h3>
                <p className="text-2xl font-semibold text-gray-900">{formatarValorBRL(totalVendas)}</p>
                <p className="text-sm text-gray-500">{meses[parseInt(mesSelecionado)]}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total de Projetos</h3>
                <p className="text-2xl font-semibold text-gray-900">{formatarValorBRL(totalProjetos)}</p>
                <p className="text-sm text-gray-500">{meses[parseInt(mesSelecionado)]}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <FolderKanban className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Ticket Médio CNAE</h3>
                <p className="text-2xl font-semibold text-gray-900">{formatarValorBRL(ticketMedioCNAE)}</p>
                <p className="text-sm text-gray-500">Por cliente</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Building2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Ticket Médio Siga Verde</h3>
                <p className="text-2xl font-semibold text-gray-900">{formatarValorBRL(ticketMedioSigaVerde)}</p>
                <p className="text-sm text-gray-500">Por cliente</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <TreeDeciduous className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Evolução */}
        <Card className="bg-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={evolucaoVendas}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatarValorBRL(value)}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="valor"
                    name="Vendas"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="tendencia"
                    name="Linha de Tendência"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Listas de Clientes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ClientesCard
            topClientes={topClientes}
            clientesNovos={clientesNovos}
            clientesChurn={clientesChurn}
          />
          <ClientesList
            title="Clientes CNAE"
            clientes={clientesCNAE}
            icon={<Building2 className="h-5 w-5" />}
            redirectTo="/clientes-cnae"
          />
          <ClientesList
            title="Clientes Siga Verde"
            clientes={clientesSigaVerde}
            icon={<TreeDeciduous className="h-5 w-5" />}
            redirectTo="/clientes-siga-verde"
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
