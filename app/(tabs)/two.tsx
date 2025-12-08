import React, { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { APP_CONFIG, API_CONFIG } from "@/src/constants/config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { CustomHeader } from "@/src/components/common/CustomHeader";
import { useAuth } from "@/src/contexts/AuthContext";
import { UserService } from "@/src/services/api";
import Toast from "react-native-toast-message";

interface User {
  _id: string;
  name: string;
  email: string;
  userType: "professor" | "aluno" | "admin";
  school: string;
  age: number;
  profileImage?: string;
  subjects?: string[];
  class?: string;
  guardian?: string[]; // Array de responsáveis (1 ou 2)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersScreen() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);

  console.log("🔍 UsersScreen: Renderizando componente");
  console.log("🔍 UsersScreen: user:", user?.name, user?.userType);
  console.log("🔍 UsersScreen: token disponível:", !!token);

  // Verificar se o usuário é admin (TEMPORARIAMENTE DESABILITADO PARA DEBUG)
  // if (user?.userType !== "admin") {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <CustomHeader title="Usuários" showSearch={false} />
  //       <View style={styles.accessDeniedContainer}>
  //         <FontAwesome
  //           name="lock"
  //           size={64}
  //           color={APP_CONFIG.PRIMARY_COLOR}
  //           style={styles.accessDeniedIcon}
  //         />
  //         <Text style={styles.accessDeniedTitle}>Acesso Restrito</Text>
  //         <Text style={styles.accessDeniedMessage}>
  //           Apenas administradores podem acessar a gestão de usuários.
  //         </Text>
  //         <Text style={styles.accessDeniedSubMessage}>
  //           Entre em contato com o administrador do sistema para mais
  //           informações.
  //         </Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  // Dados mock de usuários (fallback)
  const mockUsers: User[] = [
    {
      _id: "1",
      name: "José Matos",
      email: "jose@exemplo.com",
      userType: "professor",
      school: "Escola Seu Manuel",
      age: 35,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "2",
      name: "Maria Silva",
      email: "maria@exemplo.com",
      userType: "aluno",
      school: "Escola Seu Manuel",
      age: 16,
      class: "3º Ano",
      guardian: "João Silva",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "3",
      name: "Admin Sistema",
      email: "admin@exemplo.com",
      userType: "admin",
      school: "Escola Seu Manuel",
      age: 40,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const loadUsers = async () => {
    try {
      console.log("🔍 loadUsers: Iniciando carregamento de usuários");
      console.log("🔍 loadUsers: Token disponível?", !!token);

      if (!token) {
        throw new Error("Token não disponível");
      }

      console.log("🔍 loadUsers: Chamando UserService.getAllUsers");
      // Carregar todos os usuários (limite alto para pegar todos)
      const response = await UserService.getAllUsers(token, 1, 1000);
      console.log("🔍 loadUsers: Resposta da API:", response);
      console.log(
        "🔍 loadUsers: Usuários recebidos:",
        response.users?.length || 0
      );

      if (response.users && response.users.length > 0) {
        setUsers(response.users);
        console.log(`✅ loadUsers: ${response.users.length} usuários carregados com sucesso`);
      } else {
        console.log("⚠️ loadUsers: Nenhum usuário retornado da API");
        setUsers([]);
      }
    } catch (error) {
      console.error("❌ loadUsers: Erro ao carregar usuários:", error);
      // Não usar mock, apenas mostrar lista vazia ou erro
      setUsers([]);
      Toast.show({
        type: "error",
        text1: "Erro ao carregar usuários",
        text2: error instanceof Error ? error.message : "Tente novamente",
        position: "top",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar usuários quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      console.log("🔍 useFocusEffect: Tela recebeu foco");
      console.log("🔍 useFocusEffect: user?.userType:", user?.userType);
      console.log("🔍 useFocusEffect: token:", !!token);

      if (user?.userType === "admin" && token) {
        console.log("🔍 useFocusEffect: Condições atendidas, chamando loadUsers");
        loadUsers();
      } else {
        console.log("🔍 useFocusEffect: Condições não atendidas");
        setUsers([]);
        setLoading(false);
      }
    }, [user, token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleEditUser = (userId: string) => {
    router.push(`/edit-user?userId=${userId}`);
  };

  const handleDeleteUser = (userId: string) => {
    setUserIdToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userIdToDelete || !token) {
      setShowDeleteConfirm(false);
      return;
    }

    // Verificar se o usuário logado é admin
    console.log("🔍 Usuário logado:", user?.name, "Tipo:", user?.userType);
    if (user?.userType !== "admin") {
      Toast.show({
        type: "error",
        text1: "Acesso negado",
        text2: "Apenas administradores podem deletar usuários",
        position: "top",
      });
      setShowDeleteConfirm(false);
      setUserIdToDelete(null);
      return;
    }

    const userToDelete = users.find((u) => u._id === userIdToDelete);
    const userName = userToDelete?.name || "este usuário";

    try {
      setShowDeleteConfirm(false);
      console.log("🔍 Deletando usuário:", userIdToDelete);
      console.log("🔍 Token disponível:", !!token);
      console.log("🔍 Usuário logado é admin:", user?.userType === "admin");
      
      // Deletar usuário no backend
      await UserService.deleteUser(userIdToDelete, token);
      
      console.log("✅ Usuário deletado no backend, removendo da lista local");
      
      // Remover usuário da lista local imediatamente para feedback visual rápido
      setUsers((prevUsers) => {
        const filtered = prevUsers.filter((u) => u._id !== userIdToDelete);
        console.log(`✅ Lista local atualizada: ${prevUsers.length} -> ${filtered.length} usuários`);
        return filtered;
      });
      
      Toast.show({
        type: "success",
        text1: "Usuário deletado",
        text2: `${userName} foi deletado com sucesso`,
        position: "top",
      });

      // Aguardar um pouco antes de recarregar para garantir que o backend processou a deleção
      setTimeout(() => {
        console.log("🔄 Recarregando lista de usuários do backend...");
        loadUsers();
      }, 500);
    } catch (error: any) {
      console.error("❌ Erro ao deletar usuário:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao deletar usuário",
        text2: error.message || "Tente novamente",
        position: "top",
      });
    } finally {
      setUserIdToDelete(null);
    }
  };

  const handleAddUser = () => {
    router.push("/add-user");
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header personalizado */}
      <CustomHeader
        title="Usuários"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={true}
      />

      {/* Botão Adicionar */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
          <Text style={styles.addButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Confirmação de Deletar */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.confirmContainer} onStartShouldSetResponder={() => true}>
            <Text style={styles.confirmTitle}>Quer deletar esse usuário?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Não</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton]}
                onPress={confirmDeleteUser}
              >
                <Text style={styles.deleteButtonText}>Sim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Lista de usuários */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando usuários...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <View key={user._id} style={styles.userCard}>
              <TouchableOpacity
                style={styles.userInfo}
                onPress={() => router.push(`/user-details?userId=${user._id}`)}
                activeOpacity={0.7}
              >
                {user.profileImage && user.profileImage.trim() !== "" ? (
                  <Image
                    source={{
                      uri: (() => {
                        const imagePath = user.profileImage.trim();
                        
                        // Se já é uma URL completa, retornar como está
                        if (imagePath.includes("http")) {
                          return imagePath;
                        }
                        
                        // Construir URL base do servidor (sem /api)
                        const baseURL = API_CONFIG.BASE_URL.replace("/api", "");
                        
                        // Se começa com /, adicionar base URL do servidor
                        if (imagePath.startsWith("/")) {
                          return `${baseURL}${imagePath}`;
                        }
                        
                        // Caso contrário, construir URL completa com /uploads/
                        return `${baseURL}/uploads/${imagePath}`;
                      })(),
                    }}
                    style={styles.avatarImage}
                    onError={(error) => {
                      // Se a imagem falhar ao carregar, logar o erro
                      console.log("Erro ao carregar imagem de perfil:", error.nativeEvent?.error || "Erro desconhecido");
                    }}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userRole}>
                    {user.userType === "professor"
                      ? "Professor"
                      : user.userType === "admin"
                      ? "Administrador"
                      : "Aluno"}
                  </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userSchool}>{user.school}</Text>
                  {user.userType === "aluno" && user.class && (
                    <Text style={styles.userInfoExtra}>Turma: {user.class}</Text>
                  )}
                  {user.userType === "professor" &&
                    user.subjects &&
                    user.subjects.length > 0 && (
                      <Text style={styles.userInfoExtra}>
                        Matérias: {user.subjects.join(", ")}
                      </Text>
                    )}
                </View>
              </TouchableOpacity>
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditUser(user._id)}
                >
                  <FontAwesome name="pencil" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteUser(user._id)}
                >
                  <FontAwesome name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  addButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "flex-end",
  },
  addButton: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userCard: {
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    borderWidth: 2,
    borderColor: APP_CONFIG.PRIMARY_COLOR,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_CONFIG.PRIMARY_COLOR,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  userSchool: {
    fontSize: 12,
    color: "#888",
  },
  userInfoExtra: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  userActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#F5F5F5",
  },
  accessDeniedIcon: {
    marginBottom: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  accessDeniedMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 24,
  },
  accessDeniedSubMessage: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  deleteButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
