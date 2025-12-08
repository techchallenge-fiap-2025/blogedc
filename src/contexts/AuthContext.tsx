import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "@/src/constants/config";

interface User {
  _id: string;
  email: string;
  name: string;
  userType: "professor" | "aluno" | "admin";
  school: string;
  age: number;
  profileImage?: string;
  subjects?: string[];
  class?: string;
  guardian?: string[]; // Array de responsáveis (1 ou 2)
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // IMPORTANTE: Estado inicial sempre null para garantir que sempre comece sem autenticação
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sempre limpar autenticação ao iniciar o app
    // O fluxo sempre será: Splash → Login → Tela Principal
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // CRÍTICO: Limpar estado ANTES de limpar AsyncStorage
      // Isso garante que o componente não renderize com dados antigos
      setToken(null);
      setUser(null);

      // SEMPRE limpar dados de autenticação ao iniciar o app
      // Isso garante que o usuário sempre passe pela tela de login
      // Mesmo que o app tenha sido fechado com dados salvos
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("user_data");

      // Garantir novamente que o estado está limpo após limpar AsyncStorage
      setToken(null);
      setUser(null);

      // App iniciado - autenticação limpa. Fluxo: Splash → Login → Tela Principal
    } catch (error) {
      // Mesmo em caso de erro, garantir que o estado seja limpo
      setToken(null);
      setUser(null);
    } finally {
      // Delay sincronizado com o splash screen (1.5s)
      // Garante a ordem: Splash Screen (1.5s) → Login → Tela Principal
      setTimeout(() => {
        setIsLoading(false);
      }, 1500); // 1.5 segundos para sincronizar com o splash screen
    }
  };

  const checkAuthStatus = async () => {
    // Esta função não é mais usada, mas mantida para compatibilidade
    // O app sempre inicia sem autenticação
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Usar API_CONFIG para obter a URL correta (já usa 127.0.0.1 para iOS Simulator)
      const loginUrl = `${API_CONFIG.BASE_URL}/users/login`;
      
      console.log("🔍 Tentando fazer login:", email);
      console.log("🔍 URL:", loginUrl);

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("🔍 Response status:", response.status);
      console.log("🔍 Response ok:", response.ok);

      // Verificar se a resposta está ok antes de tentar parsear JSON
      let data;
      try {
        const responseText = await response.text();
        console.log("🔍 Response text:", responseText);
        
        // Verificar se a resposta é um erro do Vercel
        if (responseText.includes("FUNCTION_INVOCATION_FAILED") || responseText.includes("server error")) {
          throw new Error(
            "Erro no servidor. A API pode estar temporariamente indisponível."
          );
        }
        
        data = JSON.parse(responseText);
        console.log("🔍 Response data:", data);
      } catch (parseError: any) {
        console.error("❌ Erro ao parsear JSON:", parseError);
        
        // Se já é um erro que lançamos, propagar
        if (parseError.message?.includes("servidor")) {
          throw parseError;
        }
        
        throw new Error(
          "Erro ao comunicar com o servidor. Verifique se o backend está rodando."
        );
      }

      if (!response.ok || !data.success) {
        const errorMessage = data.message || data.error || "Erro no login";
        console.error("❌ Erro no login:", errorMessage);
        
        // Mensagens mais amigáveis para erros comuns
        if (errorMessage.includes("buffering timed out") || errorMessage.includes("timeout")) {
          throw new Error("Servidor temporariamente indisponível. Tente novamente em alguns instantes.");
        }
        
        throw new Error(errorMessage);
      }

      // Verificar se os dados necessários estão presentes
      if (!data.data || !data.data.token || !data.data.user) {
        console.error("❌ Dados incompletos na resposta:", data);
        throw new Error("Resposta do servidor incompleta");
      }

      console.log("✅ Login bem-sucedido");

      // Armazenar token e dados do usuário
      await AsyncStorage.setItem("auth_token", data.data.token);
      await AsyncStorage.setItem("user_data", JSON.stringify(data.data.user));

      // Atualizar estado imediatamente
      setToken(data.data.token);
      setUser(data.data.user);

      // Pequeno delay para garantir que o estado seja atualizado
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error("❌ Erro completo no login:", error);
      
      // Melhorar mensagem de erro para o usuário
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("Failed to fetch") ||
        error instanceof TypeError
      ) {
        throw new Error(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
        );
      }

      // Se já é uma mensagem de erro do servidor, usar ela
      if (error.message) {
        throw error;
      }

      // Erro genérico
      throw new Error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Limpar dados armazenados
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("user_data");

      // Limpar estado IMEDIATAMENTE
      setUser(null);
      setToken(null);
    } catch (error) {
      // Erro silencioso no logout
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
