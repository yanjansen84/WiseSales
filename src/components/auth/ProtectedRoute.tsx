import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserRole } from "@/types/user";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAccess: () => boolean;
}

const ProtectedRoute = ({ children, requiredAccess }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se não estiver autenticado, redireciona para login
    if (!isLoading && !user) {
      navigate("/login");
      return;
    }

    // Se não tiver acesso à página atual, redireciona com base no papel
    if (!isLoading && user && !requiredAccess()) {
      switch (user.role) {
        case UserRole.ADMINISTRATOR:
          navigate("/users");
          break;
        case UserRole.SALES_EXECUTIVE:
        case UserRole.FOCUS_UNIT:
          navigate("/dashboard");
          break;
      }
    }
  }, [isLoading, user, navigate, requiredAccess]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center animate-pulse">
            <span className="font-bold text-white">WS</span>
          </div>
          <div className="text-xl font-bold font-display bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
