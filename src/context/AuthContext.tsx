import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { User, UserRole, LoginCredentials } from "@/types/user";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  canAccessDashboard: () => boolean;
  canAccessUsers: () => boolean;
  canAccessPayment: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const now = new Date().toISOString();
            
            // Atualizar último acesso
            await updateDoc(userDocRef, {
              updatedAt: now
            });

            setUser({
              uid: firebaseUser.uid,
              ...userData,
              updatedAt: now
            });
          } else {
            console.error("User document not found in Firestore");
            setUser(null);
            navigate("/login");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          navigate("/login");
        }
      } else {
        setUser(null);
        navigate("/login");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const userDocRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error("Usuário não encontrado");
      }

      const userData = userDoc.data() as User;
      
      // Redirecionar com base no papel do usuário
      switch (userData.role) {
        case UserRole.ADMINISTRATOR:
          navigate("/users");
          break;
        case UserRole.SALES_EXECUTIVE:
        case UserRole.FOCUS_UNIT:
          navigate("/dashboard");
          break;
        default:
          throw new Error("Role not recognized");
      }

      toast({
        description: `Bem-vindo${userData.nome ? `, ${userData.nome}` : ""}!`,
      });

    } catch (error: any) {
      console.error("Error logging in:", error);
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        toast({
          description: "Email ou senha incorretos",
          variant: "destructive",
        });
        throw new Error("Email ou senha incorretos");
      }
      toast({
        description: "Ocorreu um erro ao fazer login. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
      toast({
        description: "Você foi desconectado",
      });
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        description: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        description: "Email de recuperação enviado com sucesso!",
      });
      navigate("/login");
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast({
        description: "Erro ao enviar email de recuperação",
        variant: "destructive",
      });
      throw error;
    }
  };

  const canAccessDashboard = () => {
    if (!user) return false;
    return user.role === UserRole.SALES_EXECUTIVE || user.role === UserRole.FOCUS_UNIT;
  };

  const canAccessUsers = () => {
    if (!user) return false;
    return user.role === UserRole.ADMINISTRATOR;
  };

  const canAccessPayment = () => {
    if (!user) return false;
    return user.role === UserRole.ADMINISTRATOR || user.role === UserRole.SALES_EXECUTIVE;
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    forgotPassword,
    canAccessDashboard,
    canAccessUsers,
    canAccessPayment,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
