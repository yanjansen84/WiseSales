import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash, MoreHorizontal, Users as UsersIcon, RefreshCw } from "lucide-react";
import { collection, onSnapshot, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, UserRole } from "@/types/user";
import { useToast } from "@/components/ui/use-toast";
import { MigrationButton } from "@/components/admin/MigrationButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserStatsCard from "@/components/users/UserStatsCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Users = () => {
  const navigate = useNavigate();
  const { user, canAccessUsers } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("todos");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!canAccessUsers()) {
      navigate("/dashboard");
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as User[];
        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [canAccessUsers, navigate]);

  // Filtrar usuários com base na pesquisa e na aba selecionada
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.nome || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                        user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTab === "todos") return matchesSearch;
    if (selectedTab === "executivos") return matchesSearch && user.role === UserRole.SALES_EXECUTIVE;
    if (selectedTab === "focos") return matchesSearch && user.role === UserRole.FOCUS_UNIT;
    if (selectedTab === "administradores") return matchesSearch && user.role === UserRole.ADMINISTRATOR;
    
    return matchesSearch;
  });

  // Estatísticas para mostrar no topo
  const stats = [
    { title: "Total de Usuários", value: users.length, icon: UsersIcon, color: "blue" },
    { title: "Executivos de Vendas", value: users.filter(u => u.role === UserRole.SALES_EXECUTIVE).length, icon: UsersIcon, color: "purple" },
    { title: "Focos de Unidade", value: users.filter(u => u.role === UserRole.FOCUS_UNIT).length, icon: UsersIcon, color: "pink" },
    { title: "Administradores", value: users.filter(u => u.role === UserRole.ADMINISTRATOR).length, icon: UsersIcon, color: "green" }
  ];

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, "users", uid));
      toast({
        title: "Usuário excluído com sucesso",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erro ao excluir usuário",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const handleRenovar = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        status: "active",
        updatedAt: new Date().toISOString()
      });
      
      toast({
        description: "Acesso renovado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao renovar acesso:", error);
      toast({
        description: "Erro ao renovar acesso",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Usuários</h1>
          <div className="flex gap-4">
            {user?.role === UserRole.ADMINISTRATOR && (
              <>
                <MigrationButton />
                <Button onClick={() => navigate("/users/criar")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <UserStatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar usuários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="executivos">Executivos</TabsTrigger>
              <TabsTrigger value="focos">Focos</TabsTrigger>
              <TabsTrigger value="administradores">Administradores</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Users Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>{user.nome || "Sem nome"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>
                      {user.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "Nunca"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/users/editar/${user.uid}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRenovar(user.uid)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Renovar Acesso
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setUserToDelete(user.uid)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (userToDelete) {
                    handleDeleteUser(userToDelete);
                    setUserToDelete(null);
                  }
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Users;
