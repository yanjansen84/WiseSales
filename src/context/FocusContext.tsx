import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { UserRole } from "@/types/user";

interface FocusContextType {
  focoSelecionado: string | null;
  setFocoSelecionado: (id: string | null) => void;
  listaFocos: { id: string; nome: string }[];
  userId: string | null;
}

const FOCO_STORAGE_KEY = "wiseSales:focoSelecionado";

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [focoSelecionado, _setFocoSelecionado] = useState<string | null>(() => {
    try {
      // Recupera o foco salvo do localStorage
      const savedFoco = localStorage.getItem(FOCO_STORAGE_KEY);
      return savedFoco ? JSON.parse(savedFoco) : null;
    } catch {
      return null;
    }
  });
  const [listaFocos, setListaFocos] = useState<{ id: string; nome: string }[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Wrapper para setFocoSelecionado que também salva no localStorage
  const setFocoSelecionado = (id: string | null) => {
    _setFocoSelecionado(id);
    if (id) {
      localStorage.setItem(FOCO_STORAGE_KEY, JSON.stringify(id));
    } else {
      localStorage.removeItem(FOCO_STORAGE_KEY);
    }
    setIsInitialized(true);
  };

  useEffect(() => {
    if (!user || user.role !== UserRole.SALES_EXECUTIVE || !user.uid) {
      setFocoSelecionado(null);
      setListaFocos([]);
      setIsInitialized(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, "users"),
        where("role", "==", UserRole.FOCUS_UNIT),
        where("associatedExecutiveId", "==", user.uid)
      ),
      (snapshot) => {
        const focosData = snapshot.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome || doc.data().email,
        }));
        setListaFocos(focosData);
        
        // Se não há foco selecionado e há focos disponíveis, seleciona o primeiro
        if (!focoSelecionado && focosData.length > 0) {
          setFocoSelecionado(focosData[0].id);
        }
        // Se o foco selecionado não existir mais na lista, seleciona o primeiro
        else if (focoSelecionado && !focosData.some(f => f.id === focoSelecionado)) {
          setFocoSelecionado(focosData[0]?.id || null);
        }
      }
    );

    return () => unsubscribe();
  }, [user, focoSelecionado]);

  // Determina o userId com base no papel do usuário e foco selecionado
  const userId = user?.role === UserRole.FOCUS_UNIT 
    ? user.uid 
    : (user?.role === UserRole.SALES_EXECUTIVE && focoSelecionado 
      ? focoSelecionado 
      : user?.uid) || null;

  return (
    <FocusContext.Provider value={{
      focoSelecionado,
      setFocoSelecionado,
      listaFocos,
      userId
    }}>
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (context === undefined) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return context;
};
