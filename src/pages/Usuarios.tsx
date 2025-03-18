import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRole } from "@/types/user";
import { Search, UserPlus } from "lucide-react";

// Mock data (substituir por dados do Firebase)
const usuarios = [
  {
    id: "1",
    nome: "João Silva",
    email: "joao@wisesales.com",
    cargo: UserRole.SALES_EXECUTIVE,
    associados: ["Maria", "Pedro"]
  },
  {
    id: "2",
    nome: "Maria Santos",
    email: "maria@wisesales.com",
    cargo: UserRole.FOCUS_UNIT,
    executivoAssociado: "João Silva"
  },
  {
    id: "3",
    nome: "Pedro Oliveira",
    email: "pedro@wisesales.com",
    cargo: UserRole.FOCUS_UNIT,
    executivoAssociado: "João Silva"
  }
];

const Usuarios = () => {
  const [busca, setBusca] = useState("");

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busca.toLowerCase()) ||
    usuario.cargo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <AppLayout requiredAccess={() => true}>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
          <Link to="/usuarios/criar">
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="h-5 w-5 mr-2" />
              Adicionar Usuário
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Barra de busca */}
            <div className="flex items-center gap-2 mb-6">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar usuários..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Tabela de usuários */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Associações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>{usuario.nome}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{usuario.cargo}</TableCell>
                      <TableCell>
                        {usuario.cargo === UserRole.SALES_EXECUTIVE ? (
                          <span className="text-sm text-gray-600">
                            {usuario.associados?.join(", ")}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-600">
                            {usuario.executivoAssociado}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Usuarios;
