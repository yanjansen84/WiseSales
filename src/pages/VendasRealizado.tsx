import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  CalendarIcon, 
  Check, 
  Plus, 
  Save, 
  Clock, 
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { onSnapshot, query, collection, where, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";

// Interface for segment type
interface Segmento {
  id: string;
  nome: string;
  meta: number;
  meses: string[];
  userId: string;
  realizado?: Record<string, number>;
  semanas?: Record<string, Record<string, number>>;
}

// Meses do ano em português
const mesesDoAno = [
  "Janeiro", "Fevereiro", "Março", "Abril", 
  "Maio", "Junho", "Julho", "Agosto", 
  "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Semanas do mês
const semanasMes = ["Semana 1", "Semana 2", "Semana 3", "Semana 4", "Semana 5"];

const VendasRealizado = () => {
  const { toast } = useToast();
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState<string>(format(new Date(), 'MMMM', { locale: ptBR }));
  const [editando, setEditando] = useState<boolean>(false);
  const [valoresSemana, setValoresSemana] = useState<Record<string, Record<string, string>>>({});
  
  // Buscar segmentos do Firebase
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      query(collection(db, "segmentos"), where("userId", "==", auth.currentUser.uid)),
      (snapshot) => {
        const segmentosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          semanas: doc.data().semanas || {},
          realizado: doc.data().realizado || {}
        } as Segmento));
        setSegmentos(segmentosData);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtrar segmentos pelo mês selecionado
  const segmentosFiltrados = segmentos.filter(segmento => 
    segmento.meses && segmento.meses.includes(mesSelecionado)
  );

  // Estado para controlar a inicialização
  const [inicializado, setInicializado] = useState(false);

  // Valores calculados usando useMemo
  const valoresCalculados = useMemo(() => {
    const novosValores: Record<string, Record<string, string>> = {};
    
    // Filtra segmentos ativos
    const segmentosAtivos = segmentos.filter(segmento => 
      segmento.meses && segmento.meses.includes(mesSelecionado)
    );

    // Calcula valores apenas se houver mudanças
    if (segmentosAtivos.length > 0) {
      segmentosAtivos.forEach(segmento => {
        novosValores[segmento.id] = {};
        
        semanasMes.forEach(semana => {
          const valorSemana = segmento.semanas?.[mesSelecionado]?.[semana];
          novosValores[segmento.id][semana] = valorSemana 
            ? (valorSemana / 100).toFixed(2).replace('.', ',')
            : '';
        });
      });
    }

    return novosValores;
  }, [segmentos, mesSelecionado]);

  // Atualiza valores apenas na inicialização ou quando mudar
  useEffect(() => {
    if (!inicializado || JSON.stringify(valoresCalculados) !== JSON.stringify(valoresSemana)) {
      setValoresSemana(valoresCalculados);
      setInicializado(true);
    }
  }, [valoresCalculados, inicializado]);
  

  // Estado para valores brutos durante a edição
  const [valoresBrutos, setValoresBrutos] = useState<Record<string, Record<string, string>>>({});

  // Função para formatar o valor ao digitar
  const handleValorChange = (segmentoId: string, semana: string, valor: string) => {
    // Permite apenas números e uma vírgula
    let valorAtual = valor
      .replace(/[^0-9,]/g, '') // Remove tudo exceto números e vírgulas
      .replace(/(,.*?),/, '$1'); // Permite apenas uma vírgula
    
    // Atualiza o valor bruto no estado
    setValoresBrutos(prev => ({
      ...prev,
      [segmentoId]: {
        ...(prev[segmentoId] || {}),
        [semana]: valorAtual
      }
    }));
  };

  // Função para formatar ao perder o foco
  const handleBlur = (segmentoId: string, semana: string) => {
    let valorBruto = valoresBrutos[segmentoId]?.[semana] || '';
    
    // Se vazio, considera como zero
    if (valorBruto.trim() === '') {
      valorBruto = '0,00';
    }
    
    // Remove caracteres não numéricos exceto vírgula
    let valorLimpo = valorBruto.replace(/[^\d,]/g, '');
    
    // Separa parte inteira e decimal
    const partes = valorLimpo.split(',');
    
    // Formata parte inteira
    let parteInteira = partes[0].replace(/\D/g, '') || '0';
    
    // Formata parte decimal
    let parteDecimal = partes[1]?.slice(0, 2) || '00';
    
    // Se não tinha vírgula, considera como valor inteiro
    if (!valorLimpo.includes(',')) {
      parteDecimal = '00';
    }
    
    // Monta valor formatado
    const valorFormatado = `${parteInteira},${parteDecimal}`;
    
    // Atualiza o estado formatado
    setValoresSemana(prev => ({
      ...prev,
      [segmentoId]: {
        ...(prev[segmentoId] || {}),
        [semana]: valorFormatado
      }
    }));
  };

  // Função para limpar e validar os valores antes de salvar
  const limparEFormatarValores = () => {
    const valoresLimpos: Record<string, Record<string, number>> = {};
    
    Object.entries(valoresSemana).forEach(([segmentoId, semanas]) => {
      valoresLimpos[segmentoId] = {};
      
      Object.entries(semanas).forEach(([semana, valor]) => {
        try {
          // Se vazio, considera como zero
          if (valor.trim() === '') {
            valoresLimpos[segmentoId][semana] = 0;
            return;
          }
          
          // Verifica formato básico
          if (!/^\d{1,3}(?:\.?\d{3})*(,\d{0,2})?$/.test(valor)) {
            throw new Error(`Formato inválido em ${segmentoId} - ${semana}`);
          }
          
          // Remove pontos de milhar e converte vírgula para ponto
          const valorLimpo = valor.replace(/\./g, '').replace(',', '.');
          
          // Converte para número
          const valorFinal = parseFloat(valorLimpo);
          
          if (isNaN(valorFinal)) {
            throw new Error(`Valor não numérico em ${segmentoId} - ${semana}`);
          }
          
          // Multiplica por 100 para armazenar em centavos
          valoresLimpos[segmentoId][semana] = Math.round(valorFinal * 100);
        } catch (error) {
          console.error(error);
          toast({
            title: "Erro de formatação",
            description: `Valor inválido no segmento ${segmentoId}, semana ${semana}. Use o formato 1234,56`,
            variant: "destructive",
          });
          throw error;
        }
      });
    });
    
    return valoresLimpos;
  };

  // Formatar valor monetário
  const formatarValor = (valor: number, emCentavos: boolean = false) => {
    // Se o valor estiver em centavos, converte para reais
    const valorFinal = emCentavos ? valor / 100 : valor;
    return valorFinal.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para salvar os valores atualizados
  const salvarValores = async () => {
    try {
      const valoresLimpos = limparEFormatarValores();
      
      // Atualizar cada segmento no Firebase
      for (const segmento of segmentos) {
        if (valoresLimpos[segmento.id]) {
          const semanasAtuais = segmento.semanas ?? {};
          const realizadoAtuais = segmento.realizado ?? {};
          
          semanasAtuais[mesSelecionado] = valoresLimpos[segmento.id];
          realizadoAtuais[mesSelecionado] = Object.values(valoresLimpos[segmento.id]).reduce((a, b) => a + b, 0);
          
          await updateDoc(doc(db, "segmentos", segmento.id), {
            semanas: semanasAtuais,
            realizado: realizadoAtuais
          });
        }
      }
      
      setEditando(false);
      toast({
        title: "Dados salvos com sucesso",
        description: "Os valores das vendas foram atualizados.",
      });
    } catch (error) {
      console.error("Erro ao salvar valores:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar os valores.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout requiredAccess={() => true}>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Vendas / Realizado</h1>
        
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Registro de Vendas</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gray-500" />
                <Select
                  value={mesSelecionado}
                  onValueChange={value => {
                    setMesSelecionado(value);
                    setEditando(false);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesDoAno.map(mes => (
                      <SelectItem key={mes} value={mes}>{mes}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {!editando ? (
                <Button onClick={() => setEditando(true)} variant="outline" className="bg-white">
                  <Plus className="mr-2 h-4 w-4 text-green-600" />
                  Adicionar Vendas
                </Button>
              ) : (
                <Button onClick={salvarValores} className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Valores
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {segmentosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>Nenhum segmento cadastrado para o mês de {mesSelecionado}.</p>
                <p className="text-sm mt-2">Adicione segmentos na página de Segmentos primeiro.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segmento</TableHead>
                      <TableHead>Meta</TableHead>
                      {semanasMes.map(semana => (
                        <TableHead key={semana}>{semana}</TableHead>
                      ))}
                      <TableHead>Total Realizado</TableHead>
                      <TableHead>% Alcançado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segmentosFiltrados.map(segmento => {
                      const totalRealizado = segmento.realizado?.[mesSelecionado] || 0;
                      const percentAlcancado = ((totalRealizado / 100) / segmento.meta) * 100;
                      
                      return (
                        <TableRow key={segmento.id}>
                          <TableCell className="font-medium">{segmento.nome}</TableCell>
                          <TableCell>
                            {formatarValor(segmento.meta)}
                          </TableCell>
                          
                          {semanasMes.map(semana => (
                            <TableCell key={semana}>
                              {editando ? (
                                <Input
                                  type="text"
                                  value={valoresBrutos[segmento.id]?.[semana] || valoresSemana[segmento.id]?.[semana] || ''}
                                  onChange={(e) => handleValorChange(segmento.id, semana, e.target.value)}
                                  onBlur={() => handleBlur(segmento.id, semana)}
                                  className="w-32"
                                  placeholder="0,00"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleBlur(segmento.id, semana);
                                      salvarValores();
                                    }
                                  }}
                                />
                              ) : (
                                <span className="font-medium text-gray-700">
                                  {segmento.semanas?.[mesSelecionado]?.[semana] 
                                    ? formatarValor(segmento.semanas[mesSelecionado][semana], true)
                                    : "R$ 0,00"}
                                </span>
                              )}
                            </TableCell>
                          ))}
                          
                          <TableCell className="font-semibold">
                            {formatarValor(totalRealizado, true)}
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>
                                  {percentAlcancado.toFixed(1)}%
                                </span>
                              </div>
                              <Progress 
                                value={percentAlcancado} 
                                className="h-2"
                                indicatorClassName={cn(
                                  percentAlcancado >= 100 
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                                    : percentAlcancado >= 70
                                      ? "bg-gradient-to-r from-yellow-500 to-amber-600"
                                      : "bg-gradient-to-r from-red-500 to-rose-600"
                                )}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {semanasMes.map((semana, index) => (
                <Card key={semana} className="bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-300 to-emerald-300 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-green-700" />
                        </div>
                        <h3 className="font-semibold text-gray-700">{semana}</h3>
                      </div>
                    </div>
                    
                    {segmentosFiltrados.length > 0 ? (
                      <div className="space-y-4">
                        {segmentosFiltrados.map(segmento => {
                          const valorSemana = segmento.semanas?.[mesSelecionado]?.[semana] || 0;
                          const metaSemanal = segmento.meta / 4; // Meta dividida por 4 semanas
                          const percentual = (valorSemana / 100) / metaSemanal * 100;
                          
                          return (
                            <div key={`${segmento.id}-${semana}`} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-gray-700">{segmento.nome}</span>
                                <span className="text-gray-500">
                                  {percentual.toFixed(0)}%
                                </span>
                              </div>
                              <Progress 
                                value={percentual} 
                                className="h-1.5"
                                indicatorClassName={cn(
                                  percentual >= 100 
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                                    : percentual >= 70
                                      ? "bg-gradient-to-r from-yellow-500 to-amber-600"
                                      : "bg-gradient-to-r from-red-500 to-rose-600"
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-2">Sem dados</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default VendasRealizado;
