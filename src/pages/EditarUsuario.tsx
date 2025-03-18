import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { User, UserRole } from "@/types/user";

interface FormData {
  nome: string;
  cargo: UserRole;
  executivoId?: string;
  status: "active" | "inactive";
}

const EditarUsuario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, canAccessUsers } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [executivos, setExecutivos] = useState<User[]>([]);
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    cargo: UserRole.FOCUS_UNIT,
    status: "active"
  });

  useEffect(() => {
    if (!canAccessUsers()) {
      navigate("/dashboard");
      return;
    }

    const loadUser = async () => {
      if (!id) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setFormData({
            nome: userData.nome || "",
            cargo: userData.role,
            executivoId: userData.associatedExecutiveId,
            status: userData.status as "active" | "inactive" || "active"
          });
        } else {
          toast({
            description: "Usuário não encontrado",
            variant: "destructive",
          });
          navigate("/users");
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        toast({
          description: "Erro ao carregar dados do usuário",
          variant: "destructive",
        });
      }
    };

    const loadExecutivos = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", UserRole.SALES_EXECUTIVE)
        );
        const snapshot = await getDocs(q);
        const executivosData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as User[];
        setExecutivos(executivosData);
      } catch (error) {
        console.error("Erro ao carregar executivos:", error);
        toast({
          description: "Erro ao carregar lista de executivos",
          variant: "destructive",
        });
      }
    };

    loadUser();
    loadExecutivos();
  }, [id, canAccessUsers, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);

    try {
      const userDocRef = doc(db, "users", id);
      await updateDoc(userDocRef, {
        nome: formData.nome,
        role: formData.cargo,
        associatedExecutiveId: formData.cargo === UserRole.FOCUS_UNIT ? formData.executivoId : null,
        status: formData.status,
        updatedAt: new Date().toISOString()
      });

      toast({
        description: "Usuário atualizado com sucesso!",
      });

      navigate("/users");
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast({
        description: "Erro ao atualizar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Editar Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select
                  value={formData.cargo}
                  onValueChange={(value: UserRole) =>
                    setFormData({ ...formData, cargo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMINISTRATOR}>
                      {UserRole.ADMINISTRATOR}
                    </SelectItem>
                    <SelectItem value={UserRole.SALES_EXECUTIVE}>
                      {UserRole.SALES_EXECUTIVE}
                    </SelectItem>
                    <SelectItem value={UserRole.FOCUS_UNIT}>
                      {UserRole.FOCUS_UNIT}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.cargo === UserRole.FOCUS_UNIT && (
                <div className="space-y-2">
                  <Label htmlFor="executivo">Executivo Responsável</Label>
                  <Select
                    value={formData.executivoId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, executivoId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o executivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {executivos.map((executivo) => (
                        <SelectItem key={executivo.uid} value={executivo.uid}>
                          {executivo.nome || executivo.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/users")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default EditarUsuario;
