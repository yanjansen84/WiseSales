import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
  requiredAccess?: () => boolean;
}

const AppLayout = ({ children, requiredAccess }: AppLayoutProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      navigate("/login");
      return;
    }

    // If user doesn't have access to this page, redirect to appropriate page
    if (!isLoading && user && requiredAccess && !requiredAccess()) {
      if (user.role === "Foco da Unidade") {
        navigate("/segmentos");
      } else if (user.role === "Executivo de Vendas") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, isLoading, navigate, requiredAccess]);

  // Show loading or nothing until auth is checked
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
