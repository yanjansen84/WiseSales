import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  ChevronRight, 
  Layers, 
  DollarSign, 
  Building2, 
  TreeDeciduous, 
  FolderKanban,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  canAccess: () => boolean;
}

const Sidebar = () => {
  const {
    user,
    logout,
    canAccessDashboard,
    canAccessUsers,
    canAccessPayment
  } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Funções de verificação de acesso
  const isFocoUnidade = () => user?.role === "Foco da Unidade";
  const isExecutivoVendas = () => user?.role === "Executivo de Vendas";
  const isAdministrador = () => user?.role === "Administrador";
  
  // Função para verificar se o usuário pode ver páginas de visualização
  const canViewPages = () => isFocoUnidade() || isExecutivoVendas() || isAdministrador();

  const sidebarItems: SidebarItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      canAccess: () => isFocoUnidade() || isExecutivoVendas()
    }, 
    {
      name: "Segmentos",
      href: "/segmentos",
      icon: <Layers className="h-5 w-5" />,
      canAccess: () => isFocoUnidade()
    },
    {
      name: "Vendas/Realizado",
      href: "/vendas-realizado",
      icon: <DollarSign className="h-5 w-5" />,
      canAccess: () => isFocoUnidade() || isExecutivoVendas()
    },
    {
      name: "Clientes CNAE",
      href: "/clientes-cnae",
      icon: <Building2 className="h-5 w-5" />,
      canAccess: () => isFocoUnidade() || isExecutivoVendas()
    },
    {
      name: "Clientes Siga Verde",
      href: "/clientes-siga-verde",
      icon: <TreeDeciduous className="h-5 w-5" />,
      canAccess: () => isFocoUnidade() || isExecutivoVendas()
    },
    {
      name: "Projetos",
      href: "/projetos",
      icon: <FolderKanban className="h-5 w-5" />,
      canAccess: () => isFocoUnidade() || isExecutivoVendas()
    },
    {
      name: "Controle de Clientes",
      href: "/controle-clientes",
      icon: <Users className="h-5 w-5" />,
      canAccess: () => isFocoUnidade() || isExecutivoVendas()
    },
    {
      name: "Usuários",
      href: "/users",
      icon: <Users className="h-5 w-5" />,
      canAccess: () => isAdministrador()
    },
    {
      name: "Configurações",
      href: "/configuracoes",
      icon: <Settings className="h-5 w-5" />,
      canAccess: canViewPages // Todos os usuários têm acesso
    }
  ];

  return <div className="h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 border-r w-64 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center">
            <span className="font-bold text-white">WS</span>
          </div>
          <h1 className="text-xl font-bold font-display bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
            Wise Sales
          </h1>
        </div>
        
        <nav className="space-y-2">
          {sidebarItems.map(item => {
          if (!item.canAccess()) return null;
          const isActive = location.pathname === item.href;
          return <Link key={item.name} to={item.href} className={cn("flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group", isActive ? "bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-md" : "text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700")}>
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-white opacity-70" />}
              </Link>;
        })}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t">
        <Button variant="outline" className="w-full justify-start gap-2 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-xl" onClick={logout}>
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </Button>
        
        <div className="mt-6 text-xs text-center text-gray-500">
          <p>Wise Sales v1.0.0</p>
          <p className="mt-1"> 2025 Todos os direitos reservados</p>
        </div>
      </div>
    </div>;
};

export default Sidebar;
