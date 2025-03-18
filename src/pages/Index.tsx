
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se o usuário já estiver logado, redirecione para a página apropriada
    if (user && !isLoading) {
      if (user.role === "Foco da Unidade") {
        navigate("/forms");
      } else if (user.role === "Executivo de Vendas") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-wise-50 to-white">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBmaWxsPSIjRjRGOUY5IiB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjUiLz48Y2lyY2xlIGZpbGwtb3BhY2l0eT0iLjAzIiBmaWxsPSIjMjJDNTVFIiBjeD0iODYxIiBjeT0iNTc4IiByPSI0ODEiLz48Y2lyY2xlIGZpbGwtb3BhY2l0eT0iLjA0IiBmaWxsPSIjMjJDNTVFIiBjeD0iNDY1IiBjeT0iMTc1IiByPSI2NDAiLz48L2c+PC9zdmc+')] opacity-50 -z-10"></div>
      
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-md bg-wise-600 flex items-center justify-center">
            <span className="font-bold text-white text-xl">WS</span>
          </div>
          <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-wise-600 to-wise-700 bg-clip-text text-transparent">
            Wise Sales
          </h1>
        </div>
        
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-wise-700 hover:text-wise-800 hover:bg-wise-100">
              Entrar
            </Button>
          </Link>
          <Link to="/login">
            <Button className="bg-wise-600 hover:bg-wise-700 text-white">
              Começar agora
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-6 leading-tight">
              Gerencie seus cinemas com <span className="text-wise-600">inteligência</span> e <span className="text-wise-600">simplicidade</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              O Wise Sales é a plataforma ideal para gerenciar os dados de venda e satisfação do seu cinema. 
              Com diferentes perfis e permissões, cada membro da equipe tem acesso exatamente ao que precisa.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/login">
                <Button size="lg" className="bg-wise-600 hover:bg-wise-700 text-white">
                  Começar agora
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-wise-600 text-wise-700 hover:bg-wise-50">
                Saiba mais
              </Button>
            </div>
            
            <div className="mt-12 flex gap-8">
              <div>
                <div className="text-3xl font-bold text-wise-700 mb-2">+500</div>
                <p className="text-gray-600">Cinemas atendidos</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-wise-700 mb-2">97%</div>
                <p className="text-gray-600">Satisfação</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-wise-700 mb-2">24/7</div>
                <p className="text-gray-600">Suporte ao cliente</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl bg-white shadow-2xl shadow-wise-100/50 p-8 border border-gray-100 relative">
            <div className="absolute -top-4 -right-4 bg-wise-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Sistema #1 para cinemas
            </div>
            <div className="space-y-6">
              <div className="bg-wise-50 p-4 rounded-lg">
                <h3 className="font-medium text-wise-800 mb-2">Dashboard Completo</h3>
                <p className="text-gray-600 text-sm">Visualize todos os dados de vendas e desempenho em um só lugar.</p>
              </div>
              <div className="bg-wise-50 p-4 rounded-lg">
                <h3 className="font-medium text-wise-800 mb-2">Controle de Acesso</h3>
                <p className="text-gray-600 text-sm">Diferentes níveis de permissão para cada tipo de usuário.</p>
              </div>
              <div className="bg-wise-50 p-4 rounded-lg">
                <h3 className="font-medium text-wise-800 mb-2">Formulários Intuitivos</h3>
                <p className="text-gray-600 text-sm">Coleta de dados simplificada para os Focos da Unidade.</p>
              </div>
              <div className="bg-wise-50 p-4 rounded-lg">
                <h3 className="font-medium text-wise-800 mb-2">Gestão de Pagamentos</h3>
                <p className="text-gray-600 text-sm">Acompanhe e gerencie pagamentos de forma simples e segura.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="mt-20 bg-gray-50 border-t border-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <div className="w-8 h-8 rounded-md bg-wise-600 flex items-center justify-center">
                <span className="font-bold text-white text-sm">WS</span>
              </div>
              <h2 className="text-xl font-bold font-display text-wise-700">
                Wise Sales
              </h2>
            </div>
            
            <div className="text-center md:text-right text-gray-500 text-sm">
              &copy; 2023 Wise Sales. Todos os direitos reservados.<br />
              Desenvolvido com cuidado para cinemas de todo o Brasil.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
