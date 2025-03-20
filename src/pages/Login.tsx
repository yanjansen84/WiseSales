
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";

const Login = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      // Redirecionamento baseado no papel do usuário
      if (user.role === "Foco da Unidade") {
        navigate("/dashboard");
      } else if (user.role === "Executivo de Vendas") {
        navigate("/dashboard");
      } else {
        navigate("/users");
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
      {/* Elementos decorativos em gradiente */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-green-500/10 blur-3xl"></div>
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl"></div>
        <div className="absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-green-400/10 blur-3xl"></div>
      </div>
      
      {/* Grid decorativo */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="h-full w-full bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>
      
      {/* Container principal */}
      <div className="flex flex-col lg:flex-row w-full z-10">
        {/* Painel lateral - visível apenas em telas maiores */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 text-white flex-col justify-center items-center p-10 relative overflow-hidden">
          {/* Círculos decorativos */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-white/5"></div>
          
          <div className="max-w-md space-y-8 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8">
              <div className="text-4xl font-bold">W</div>
            </div>
            <h1 className="text-5xl font-bold font-display leading-tight">Wise Expert</h1>
            <p className="text-white/90 text-xl">
              A plataforma completa para gerenciamento de dados e satisfação do seu cinema.
            </p>
            <div className="grid grid-cols-1 gap-5 mt-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 transition-all duration-300 hover:bg-white/15">
                <h3 className="font-semibold text-lg mb-2">Visão Estratégica</h3>
                <p className="text-white/80">Acompanhe em tempo real metas, campanhas e resultados de vendas.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 transition-all duration-300 hover:bg-white/15">
                <h3 className="font-semibold text-lg mb-2">Gestão de Desempenho</h3>
                <p className="text-white/80">Monitore as vendas, clientes inativos, e as principais oportunidades de crescimento.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 transition-all duration-300 hover:bg-white/15">
                <h3 className="font-semibold text-lg mb-2">Insights Inteligentes</h3>
                <p className="text-white/80">Tome decisões estratégicas com base em dados detalhados e análises precisas.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Formulário de login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md animate-fade-in">
            <div className="mb-10 text-center">
              <div className="lg:hidden inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 flex items-center justify-center shadow-lg">
                  <span className="font-bold text-white text-2xl">WS</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold font-display mb-3 bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">Bem-vindo(a)</h1>
              <p className="text-gray-600">Entre com suas credenciais para acessar sua conta</p>
            </div>
            
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
