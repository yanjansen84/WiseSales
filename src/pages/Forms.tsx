
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FileText, Save, CheckCircle2 } from "lucide-react";

// Form schema
const salesFormSchema = z.object({
  date: z.string(),
  movieTitle: z.string().min(2, { message: "Movie title must be at least 2 characters." }),
  ticketsSold: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Tickets sold must be a positive number.",
  }),
  revenue: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Revenue must be a positive number.",
  }),
  notes: z.string().optional(),
  category: z.string({
    required_error: "Please select a category.",
  }),
});

// Survey form schema
const surveyFormSchema = z.object({
  date: z.string(),
  totalResponses: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Total responses must be a positive number.",
  }),
  satisfactionScore: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 10,
    {
      message: "Satisfaction score must be between 1 and 10.",
    }
  ),
  recommendationRate: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
    {
      message: "Recommendation rate must be between 0 and 100%.",
    }
  ),
  feedback: z.string().optional(),
});

const Forms = () => {
  const { canAccessForms } = useAuth();
  const [submittedForms, setSubmittedForms] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("sales");

  // Sales form
  const salesForm = useForm<z.infer<typeof salesFormSchema>>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      movieTitle: "",
      ticketsSold: "",
      revenue: "",
      notes: "",
      category: "",
    },
  });

  // Survey form
  const surveyForm = useForm<z.infer<typeof surveyFormSchema>>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      totalResponses: "",
      satisfactionScore: "",
      recommendationRate: "",
      feedback: "",
    },
  });

  const onSubmitSalesForm = (data: z.infer<typeof salesFormSchema>) => {
    console.log("Sales form submitted:", data);
    toast.success("Sales form submitted successfully");
    setSubmittedForms([...submittedForms, `sales-${Date.now()}`]);
    salesForm.reset({
      date: new Date().toISOString().split("T")[0],
      movieTitle: "",
      ticketsSold: "",
      revenue: "",
      notes: "",
      category: "",
    });
  };

  const onSubmitSurveyForm = (data: z.infer<typeof surveyFormSchema>) => {
    console.log("Survey form submitted:", data);
    toast.success("Survey form submitted successfully");
    setSubmittedForms([...submittedForms, `survey-${Date.now()}`]);
    surveyForm.reset({
      date: new Date().toISOString().split("T")[0],
      totalResponses: "",
      satisfactionScore: "",
      recommendationRate: "",
      feedback: "",
    });
  };

  return (
    <AppLayout requiredAccess={canAccessForms}>
      <div className="page-container">
        <div className="flex flex-col gap-1 mb-6">
          <span className="text-sm font-medium text-wise-600">Cinema Data</span>
          <h1 className="page-title">Formulários</h1>
          <p className="page-subtitle">
            Envie dados do seu cinema para análise
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="glass-card overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle>Coleta de Dados</CardTitle>
                <CardDescription>
                  Por favor, preencha os formulários abaixo com informações precisas para análise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="sales" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Dados de Vendas
                    </TabsTrigger>
                    <TabsTrigger value="survey" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Pesquisa de Clientes
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sales" className="mt-0">
                    <Form {...salesForm}>
                      <form onSubmit={salesForm.handleSubmit(onSubmitSalesForm)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={salesForm.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={salesForm.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Categoria do Filme</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="action">Ação</SelectItem>
                                    <SelectItem value="comedy">Comédia</SelectItem>
                                    <SelectItem value="drama">Drama</SelectItem>
                                    <SelectItem value="horror">Terror</SelectItem>
                                    <SelectItem value="scifi">Ficção Científica</SelectItem>
                                    <SelectItem value="family">Família</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={salesForm.control}
                          name="movieTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título do Filme</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o título do filme" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={salesForm.control}
                            name="ticketsSold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ingressos Vendidos</FormLabel>
                                <FormControl>
                                  <Input placeholder="Número de ingressos" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={salesForm.control}
                            name="revenue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Receita (R$)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Receita total" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={salesForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notas Adicionais</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Qualquer informação adicional sobre esta exibição"
                                  {...field}
                                  rows={3}
                                />
                              </FormControl>
                              <FormDescription>
                                Opcional: Forneça qualquer contexto adicional sobre esta exibição.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="w-full md:w-auto bg-wise-600 hover:bg-wise-700">
                          <Save className="mr-2 h-4 w-4" />
                          Enviar Dados de Vendas
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="survey" className="mt-0">
                    <Form {...surveyForm}>
                      <form onSubmit={surveyForm.handleSubmit(onSubmitSurveyForm)} className="space-y-6">
                        <FormField
                          control={surveyForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data da Pesquisa</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={surveyForm.control}
                            name="totalResponses"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total de Respostas</FormLabel>
                                <FormControl>
                                  <Input placeholder="Número de respostas" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={surveyForm.control}
                            name="satisfactionScore"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nota de Satisfação (1-10)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nota média" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={surveyForm.control}
                            name="recommendationRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Taxa de Recomendação (%)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Porcentagem que recomendaria" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={surveyForm.control}
                          name="feedback"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Resumo do Feedback dos Clientes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Resuma os pontos-chave do feedback"
                                  {...field}
                                  rows={3}
                                />
                              </FormControl>
                              <FormDescription>
                                Inclua comentários comuns e sugestões de melhoria.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="w-full md:w-auto bg-wise-600 hover:bg-wise-700">
                          <Save className="mr-2 h-4 w-4" />
                          Enviar Dados da Pesquisa
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Enviados Recentemente</CardTitle>
                <CardDescription>
                  Seus envios recentes de formulários
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submittedForms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p>Nenhum formulário enviado ainda</p>
                    <p className="text-sm">Formulários enviados aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submittedForms.map((formId) => (
                      <div key={formId} className="flex items-center gap-3 p-3 rounded-md bg-white border animate-in">
                        <div className="bg-wise-100 p-1.5 rounded-full text-wise-700">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {formId.startsWith("sales") ? "Dados de Vendas" : "Dados de Pesquisa"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-4">
                <Button variant="outline" className="w-full text-wise-700" onClick={() => setSubmittedForms([])}>
                  Limpar Histórico
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="glass-card mt-6">
              <CardHeader>
                <CardTitle>Precisa de Ajuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="bg-wise-100 p-1 rounded-full text-wise-700 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span>Envie dados diariamente para cada exibição de filme</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-wise-100 p-1 rounded-full text-wise-700 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span>Complete pesquisas de clientes pelo menos semanalmente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-wise-100 p-1 rounded-full text-wise-700 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span>Forneça informações precisas para melhores análises</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Forms;
