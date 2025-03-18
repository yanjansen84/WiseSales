import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/user";

interface ProtectedRouteProps {
  element: JSX.Element;
  requiredRole?: UserRole[];
}

const ProtectedRoute = ({ element, requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // ou um componente de loading
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !requiredRole.includes(user.role)) {
    // Se não tem permissão, redireciona para a página inicial do usuário
    if (user.role === UserRole.ADMINISTRATOR) {
      return <Navigate to="/usuarios" replace />;
    } else if (user.role === UserRole.SALES_EXECUTIVE) {
      return <Navigate to="/dashboard" replace />;
    } else if (user.role === UserRole.FOCUS_UNIT) {
      return <Navigate to="/segmentos" replace />;
    }
  }

  return element;
};

export default ProtectedRoute;
