import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import SplashScreenComponent from "@/components/SplashScreen";
import { useSplashScreen } from "@/hooks/useSplashScreen";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import Toast from "react-native-toast-message";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Não definir initialRouteName para garantir que o fluxo seja controlado pela autenticação
  // O fluxo será: Splash → Login → Tela Principal
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const { isVisible } = useSplashScreen();
  const segments = useSegments();

  // 2. Verificação explícita: se não há user OU token, não está autenticado
  // Isso garante que mesmo se isAuthenticated estiver incorreto, ainda forçamos o login
  const isReallyAuthenticated = !!(user && token && isAuthenticated);

  // 3. Redirecionamento automático: se não autenticado e não está na tela de login, redirecionar
  // IMPORTANTE: useEffect deve ser chamado ANTES de qualquer return condicional
  useEffect(() => {
    if (!isLoading && !isVisible) {
      const inAuthGroup = segments[0] === "(tabs)" || segments[0] === "posts" || segments[0] === "profile" || segments[0] === "create-post" || segments[0] === "edit-post";
      
      if (!isReallyAuthenticated && inAuthGroup) {
        // Forçar redirecionamento para login se tentar acessar rotas protegidas
        router.replace("/login");
      } else if (isReallyAuthenticated && segments[0] === "login") {
        // Se autenticado e está na tela de login, redirecionar para home
        router.replace("/(tabs)");
      }
    }
  }, [isReallyAuthenticated, isLoading, isVisible, segments]);

  // Ordem garantida: Splash Screen → Login → Tela Principal
  // 1. Mostrar splash screen enquanto está carregando OU enquanto o splash está visível
  if (isLoading || isVisible) {
    return <SplashScreenComponent visible={true} />;
  }

  // 4. Após o splash, mostrar login se não autenticado
  // 5. Se autenticado, mostrar tela principal
  const key = isReallyAuthenticated ? "authenticated" : "not-authenticated";

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack key={key} screenOptions={{ headerShown: false }}>
        {!isReallyAuthenticated ? (
          // Usuário não autenticado → mostrar tela de login
          <>
            <Stack.Screen name="login" options={{ title: "Login" }} />
            {/* Bloquear acesso a outras rotas quando não autenticado */}
            <Stack.Screen name="(tabs)" options={{ href: null }} />
            <Stack.Screen name="posts/[id]" options={{ href: null }} />
            <Stack.Screen name="profile/[userId]" options={{ href: null }} />
            <Stack.Screen name="create-post" options={{ href: null }} />
            <Stack.Screen name="edit-post" options={{ href: null }} />
            <Stack.Screen name="modal" options={{ href: null }} />
          </>
        ) : (
          // Usuário autenticado → mostrar tela principal e outras rotas
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="posts/[id]"
              options={{ title: "Detalhes do Post" }}
            />
            <Stack.Screen
              name="profile/[userId]"
              options={{ title: "Perfil do Usuário" }}
            />
            <Stack.Screen
              name="create-post"
              options={{ title: "Criar Post" }}
            />
            <Stack.Screen
              name="edit-post"
              options={{ title: "Editar Post" }}
            />
            <Stack.Screen
              name="add-user"
              options={{ title: "Adicionar Usuário" }}
            />
            <Stack.Screen
              name="edit-user"
              options={{ title: "Editar Usuário" }}
            />
            <Stack.Screen
              name="user-details"
              options={{ title: "Detalhes do Usuário" }}
            />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            {/* Bloquear acesso ao login quando autenticado */}
            <Stack.Screen name="login" options={{ href: null }} />
          </>
        )}
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
      <Toast />
    </AuthProvider>
  );
}
