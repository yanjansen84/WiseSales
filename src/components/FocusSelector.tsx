import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFocus } from "@/context/FocusContext";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/user";

export const FocusSelector = () => {
  const { user } = useAuth();
  const { focoSelecionado, setFocoSelecionado, listaFocos } = useFocus();

  // Para debug
  console.log('FocusSelector:', {
    userRole: user?.role,
    listaFocos,
    focoSelecionado
  });

  // Mostra o seletor apenas para executivos e quando há focos disponíveis
  if (!user || user.role !== UserRole.SALES_EXECUTIVE || listaFocos.length === 0) {
    return null;
  }

  return (
    <div className="w-[200px]">
      <Select
        value={focoSelecionado || ""}
        onValueChange={setFocoSelecionado}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecionar foco" />
        </SelectTrigger>
        <SelectContent>
          {listaFocos.map((foco) => (
            <SelectItem key={foco.id} value={foco.id}>
              {foco.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
