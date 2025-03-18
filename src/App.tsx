import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import CriarUsuario from "./pages/CriarUsuario";
import EditarUsuario from "./pages/EditarUsuario";
import NotFound from "./pages/NotFound";
import Segmentos from "./pages/Segmentos";
import VendasRealizado from "./pages/VendasRealizado";
import ClientesCNAE from "./pages/ClientesCNAE";
import ClientesSigaVerde from "./pages/ClientesSigaVerde";
import Projetos from "./pages/Projetos";
import Configuracoes from "./pages/Configuracoes";
import ControleClientes from "./pages/ControleClientes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/criar" element={<CriarUsuario />} />
            <Route path="/users/editar/:id" element={<EditarUsuario />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            
            {/* Novas rotas para o usuário "Foco da Unidade" */}
            <Route path="/segmentos" element={<Segmentos />} />
            <Route path="/vendas-realizado" element={<VendasRealizado />} />
            <Route path="/clientes-cnae" element={<ClientesCNAE />} />
            <Route path="/clientes-siga-verde" element={<ClientesSigaVerde />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/controle-clientes" element={<ControleClientes />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
