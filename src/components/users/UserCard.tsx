
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  ChevronRight,
  BarChart3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

interface UserMetrics {
  vendas: number;
  clientes: number;
  satisfacao: number;
}

interface UserProps {
  id: number;
  name: string;
  email: string;
  role: string;
  location: string;
  avatar: string;
  status: string;
  lastActive: string;
  metrics: UserMetrics;
  phone: string;
  dateJoined: string;
}

interface UserCardProps {
  user: UserProps;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-700 border-green-200";
      case "ausente":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "inativo":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo":
        return "Ativo";
      case "ausente":
        return "Ausente";
      case "inativo":
        return "Inativo";
      default:
        return status;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Executivo de Vendas":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Foco da Unidade":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Administrador":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-gradient-to-r from-emerald-500 to-teal-500";
    if (value >= 70) return "bg-gradient-to-r from-blue-500 to-indigo-500";
    if (value >= 50) return "bg-gradient-to-r from-amber-500 to-orange-500";
    return "bg-gradient-to-r from-red-500 to-rose-500";
  };

  return (
    <Card className="overflow-hidden border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-0">
        <div className="flex justify-between items-start p-5 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-full h-full flex items-center justify-center text-white font-medium">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-800 line-clamp-1">{user.name}</h3>
              <div className="flex items-center mt-1">
                <Badge className={`font-normal rounded-full px-2.5 py-0.5 text-xs ${getStatusColor(user.status)}`}>
                  {getStatusLabel(user.status)}
                </Badge>
                <span className="text-xs text-gray-500 ml-2 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {user.lastActive}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full" aria-label="Menu de opções">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Editar usuário</DropdownMenuItem>
              <DropdownMenuItem>Redefinir senha</DropdownMenuItem>
              <DropdownMenuItem>Atribuir permissões</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Desativar conta</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center text-sm">
              <Badge variant="outline" className={`mr-2 ${getRoleColor(user.role)} font-normal`}>
                {user.role}
              </Badge>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="mr-2 h-4 w-4 text-gray-400" />
              <span className="truncate">{user.email}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="mr-2 h-4 w-4 text-gray-400" />
              <span>{user.phone}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="mr-2 h-4 w-4 text-gray-400" />
              <span>{user.location}</span>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vendas</span>
                <span className="font-medium">{user.metrics.vendas}%</span>
              </div>
              <Progress value={user.metrics.vendas} className="h-2" indicatorClassName={getProgressColor(user.metrics.vendas)} />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Satisfação</span>
                <span className="font-medium">{user.metrics.satisfacao}%</span>
              </div>
              <Progress value={user.metrics.satisfacao} className="h-2" indicatorClassName={getProgressColor(user.metrics.satisfacao)} />
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Cadastrado em: {user.dateJoined}
        </div>
        <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg">
          <BarChart3 className="h-4 w-4 mr-1" />
          Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserCard;
