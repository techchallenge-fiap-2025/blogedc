import React, { useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
}) => {
  const { user, isAuthenticated, token, isLoading } = useAuth();

  useEffect(() => {
    // Se não está carregando e não está autenticado, redirecionar para login
    if (!isLoading && (!isAuthenticated || !user || !token)) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, user, token]);

  // Verificação explícita: se não há user OU token, não está autenticado
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user || !token) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>🔒 Acesso Restrito</Text>
          <Text style={styles.message}>
            Você precisa estar logado para acessar esta área.
          </Text>
          <Text style={styles.subMessage}>Redirecionando para login...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B35",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});
