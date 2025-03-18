import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { FocusProvider } from "@/context/FocusContext";
import { UserRole } from "@/types/user"; // Corrigindo a importação do UserRole
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
import ProtectedRoute from "@/components/ProtectedRoute"; // Import the ProtectedRoute component

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FocusProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={
                <ProtectedRoute 
                  element={<Dashboard />} 
                  requiredRole={[UserRole.ADMINISTRATOR, UserRole.SALES_EXECUTIVE, UserRole.FOCUS_UNIT]} 
                />
              } />
              <Route path="/users" element={
                <ProtectedRoute 
                  element={<Users />} 
                  requiredRole={[UserRole.ADMINISTRATOR]} 
                />
              } />
              <Route path="/users/criar" element={
                <ProtectedRoute 
                  element={<CriarUsuario />} 
                  requiredRole={[UserRole.ADMINISTRATOR]} 
                />
              } />
              <Route path="/users/editar/:id" element={
                <ProtectedRoute 
                  element={<EditarUsuario />} 
                  requiredRole={[UserRole.ADMINISTRATOR]} 
                />
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute 
                  element={<Configuracoes />} 
                  requiredRole={[UserRole.ADMINISTRATOR, UserRole.SALES_EXECUTIVE, UserRole.FOCUS_UNIT]} 
                />
              } />
              
              {/* Novas rotas para o usuário "Foco da Unidade" */}
              <Route path="/segmentos" element={
                <ProtectedRoute 
                  element={<Segmentos />} 
                  requiredRole={[UserRole.ADMINISTRATOR, UserRole.FOCUS_UNIT,]} 
                />
              } />
              <Route path="/vendas-realizado" element={
                <ProtectedRoute 
                  element={<VendasRealizado />} 
                  requiredRole={[UserRole.SALES_EXECUTIVE, UserRole.FOCUS_UNIT]} 
                />
              } />
              <Route path="/clientes-cnae" element={
                <ProtectedRoute 
                  element={<ClientesCNAE />} 
                  requiredRole={[UserRole.SALES_EXECUTIVE, UserRole.FOCUS_UNIT]} 
                />
              } />
              <Route path="/clientes-siga-verde" element={
                <ProtectedRoute 
                  element={<ClientesSigaVerde />} 
                  requiredRole={[UserRole.SALES_EXECUTIVE, UserRole.FOCUS_UNIT]} 
                />
              } />
              <Route path="/projetos" element={
                <ProtectedRoute 
                  element={<Projetos />} 
                  requiredRole={[UserRole.ADMINISTRATOR, UserRole.SALES_EXECUTIVE, UserRole.FOCUS_UNIT]} 
                />
              } />
              <Route path="/controle-clientes" element={
                <ProtectedRoute 
                  element={<ControleClientes />} 
                  requiredRole={[UserRole.SALES_EXECUTIVE, UserRole.FOCUS_UNIT]} 
                />
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FocusProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
