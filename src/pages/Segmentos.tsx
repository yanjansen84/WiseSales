import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { Plus, Edit, Trash, Check } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User } from "@/types/user";

interface Segmento {
  id: string;
  nome: string;
  meta: number;
  meses: string[];
  realizado: number;
  userId: string;
}

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  meta: z.coerce.number().min(1, "Meta deve ser maior que zero"),
  meses: z.array(z.string()).min(1, "Selecione pelo menos um mês"),
});

export default function Segmentos() {
  const { user } = useAuth();
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      meta: 0,
      meses: [],
    },
  });

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, "segmentos"), (snapshot) => {
      const segmentosData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Segmento))
        .filter(segmento => segmento.userId === auth.currentUser?.uid);

      setSegmentos(segmentosData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    form.setValue("meses", selectedMonths);
  }, [selectedMonths]);

  const onSubmit = async (data) => {
    try {
      if (!user) return;

      if (editandoId) {
        await updateDoc(doc(db, "segmentos", editandoId), {
          nome: data.nome,
          meta: data.meta,
          meses: data.meses,
          userId: auth.currentUser?.uid,
        });
        toast.success("Segmento atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "segmentos"), {
          ...data,
          userId: auth.currentUser?.uid,
          realizado: 0,
        });
        toast.success("Segmento criado com sucesso!");
      }

      form.reset();
      setSelectedMonths([]);
      setEditandoId(null);
    } catch (error) {
      console.error("Erro ao salvar segmento:", error);
      toast.error("Erro ao salvar segmento");
    }
  };

  const iniciarEdicao = (segmento: Segmento) => {
    form.reset({
      nome: segmento.nome,
      meta: segmento.meta,
      meses: segmento.meses,
    });
    setSelectedMonths(segmento.meses);
    setEditandoId(segmento.id);
  };

  const excluirSegmento = async (id: string) => {
    try {
      await deleteDoc(doc(db, "segmentos", id));
      toast.success("Segmento excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir segmento:", error);
      toast.error("Erro ao excluir segmento");
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-6">Segmentos</h1>

        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <h2 className="text-base font-medium mb-4">Criar Novo Segmento</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal text-gray-700">Nome do Segmento</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Varejo, Indústria, etc." 
                          className="border-gray-200" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="meta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal text-gray-700">Meta do Segmento (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          className="border-gray-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="meses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-normal text-gray-700">Meses</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange([...field.value, value]);
                        }}
                        value=""
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione os meses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
                              .filter(mes => !field.value.includes(mes))
                              .map((mes) => (
                                <SelectItem key={mes} value={mes}>
                                  {mes}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value.map((mes) => (
                        <div key={mes} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                          <span className="text-sm">{mes}</span>
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange(field.value.filter(m => m !== mes));
                            }}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <Trash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-normal text-sm h-9 px-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Segmento
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold px-6 py-4 border-b border-gray-100">Segmentos Cadastrados</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Nome</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Meta (R$)</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Meses</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Realizado</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {segmentos.map((segmento, index) => (
                  <tr key={segmento.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 text-sm">{segmento.nome}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(segmento.meta)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {segmento.meses.map((mes) => (
                          <span
                            key={mes}
                            className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs"
                          >
                            {mes.substring(0, 3)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(segmento.realizado || 0)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({Math.round(((segmento.realizado || 0) / segmento.meta) * 100)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div
                            className="h-2 bg-yellow-500 rounded-full"
                            style={{
                              width: `${Math.min(((segmento.realizado || 0) / segmento.meta) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => iniciarEdicao(segmento)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => excluirSegmento(segmento.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
