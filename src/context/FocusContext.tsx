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

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [focoSelecionado, setFocoSelecionado] = useState<string | null>(null);
  const [listaFocos, setListaFocos] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    if (!user || user.role !== UserRole.SALES_EXECUTIVE || !user.uid) return;

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
        if (focosData.length > 0 && !focoSelecionado) {
          setFocoSelecionado(focosData[0].id);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

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
