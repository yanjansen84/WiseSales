import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { User, UserRole } from "@/types/user";

interface FormData {
  email: string;
  password: string;
  nome: string;
  cargo: UserRole;
  executivoId?: string;
}

const CriarUsuario = () => {
  const navigate = useNavigate();
  const { user: currentUser, canAccessUsers } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [executivos, setExecutivos] = useState<User[]>([]);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    nome: "",
    cargo: UserRole.FOCUS_UNIT,
  });

  useEffect(() => {
    if (!canAccessUsers()) {
      navigate("/dashboard");
      return;
    }

    // Carregar lista de executivos
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

    loadExecutivos();
  }, [canAccessUsers, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Criar uma nova instância do Firebase Auth apenas para criação do usuário
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };
      
      const tempApp = initializeApp(firebaseConfig, "tempAuth");
      
      const tempAuth = getAuth(tempApp);
      
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        tempAuth,
        formData.email,
        formData.password
      );

      // Criar documento do usuário no Firestore
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const now = new Date().toISOString();
      
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        email: formData.email,
        nome: formData.nome,
        role: formData.cargo,
        associatedExecutiveId: formData.cargo === UserRole.FOCUS_UNIT ? formData.executivoId : null,
        status: "active",
        createdAt: now,
        updatedAt: now
      });

      toast({
        description: "Usuário criado com sucesso!",
      });

      navigate("/users");
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.code === "auth/email-already-in-use") {
        toast({
          description: "Este email já está em uso",
          variant: "destructive",
        });
      } else {
        toast({
          description: "Erro ao criar usuário",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Usuário</CardTitle>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
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

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/users")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar Usuário"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CriarUsuario;
