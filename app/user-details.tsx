import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { APP_CONFIG, API_CONFIG } from "@/src/constants/config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/src/contexts/AuthContext";
import { router, useLocalSearchParams } from "expo-router";
import { UserService } from "@/src/services/api";

type UserType = "professor" | "aluno" | "admin";

interface UserDetails {
  _id: string;
  name: string;
  email: string;
  userType: UserType;
  school: string;
  age: number;
  profileImage?: string;
  class?: string;
  guardian?: string[];
  subjects?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export default function UserDetailsScreen() {
  const { token } = useAuth();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetails | null>(null);

  useEffect(() => {
    if (userId && token) {
      loadUserData();
    }
  }, [userId, token]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await UserService.getUserById(userId!, token!);
      const userData = response.user;

      setUser({
        _id: userData._id || userData.id,
        name: userData.name || "",
        email: userData.email || "",
        userType: userData.userType as UserType,
        school: userData.school || "",
        age: userData.age || 0,
        profileImage: userData.profileImage,
        class: userData.class,
        guardian: Array.isArray(userData.guardian)
          ? userData.guardian
          : userData.guardian
          ? [userData.guardian]
          : undefined,
        subjects: Array.isArray(userData.subjects) ? userData.subjects : [],
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        lastLogin: userData.lastLogin,
      });
    } catch (error: any) {
      console.error("Erro ao carregar usuário:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao carregar usuário",
        text2: error.message || "Tente novamente",
        position: "top",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getImageUri = () => {
    if (!user?.profileImage) return null;
    
    // Se já é uma URL completa, retornar como está
    if (user.profileImage.includes("http")) return user.profileImage;
    
    // Construir URL base do servidor (sem /api)
    const baseURL = API_CONFIG.BASE_URL.replace("/api", "");
    
    // Se começa com /, adicionar base URL do servidor
    if (user.profileImage.startsWith("/")) {
      return `${baseURL}${user.profileImage}`;
    }
    
    // Caso contrário, construir URL completa com /uploads/
    return `${baseURL}/uploads/${user.profileImage}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Carregando dados do usuário...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Usuário não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com botão de voltar e ações */}
      <LinearGradient
        colors={["#FF6B35", "#FF8A65"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Usuário</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Imagem de Perfil */}
          <View style={styles.section}>
            <View style={styles.profileImageContainer}>
              {getImageUri() ? (
                <Image source={{ uri: getImageUri()! }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImageText}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status do Usuário */}
          <View style={styles.section}>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  user.isActive ? styles.statusActive : styles.statusInactive,
                ]}
              >
                <Text style={styles.statusText}>
                  {user.isActive ? "Ativo" : "Inativo"}
                </Text>
              </View>
              <View style={styles.userTypeBadge}>
                <Text style={styles.userTypeText}>
                  {user.userType === "professor"
                    ? "Professor"
                    : user.userType === "aluno"
                    ? "Aluno"
                    : "Administrador"}
                </Text>
              </View>
            </View>
          </View>

          {/* Dados Pessoais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome Completo</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>E-mail</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Escola</Text>
              <Text style={styles.infoValue}>{user.school}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Idade</Text>
              <Text style={styles.infoValue}>{user.age} anos</Text>
            </View>
          </View>

          {/* Dados Específicos de Aluno */}
          {user.userType === "aluno" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados do Aluno</Text>

              {user.class && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Turma</Text>
                  <Text style={styles.infoValue}>{user.class}</Text>
                </View>
              )}

              {user.guardian && user.guardian.length > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {user.guardian.length > 1 ? "Responsáveis" : "Responsável"}
                  </Text>
                  <View style={styles.guardianList}>
                    {user.guardian.map((guardian, index) => (
                      <Text key={index} style={styles.infoValue}>
                        {guardian}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Dados Específicos de Professor */}
          {user.userType === "professor" && user.subjects && user.subjects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados do Professor</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Matérias</Text>
                <View style={styles.subjectsList}>
                  {user.subjects.map((subject, index) => (
                    <View key={index} style={styles.subjectBadge}>
                      <Text style={styles.subjectText}>{subject}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Informações do Sistema */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações do Sistema</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID do Usuário</Text>
              <Text style={styles.infoValueSmall}>{user._id}</Text>
            </View>

            {user.createdAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Data de Cadastro</Text>
                <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
              </View>
            )}

            {user.updatedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Última Atualização</Text>
                <Text style={styles.infoValue}>{formatDate(user.updatedAt)}</Text>
              </View>
            )}

            {user.lastLogin && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Último Login</Text>
                <Text style={styles.infoValue}>{formatDate(user.lastLogin)}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_CONFIG.PRIMARY_COLOR,
    marginBottom: 16,
  },
  profileImageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: APP_CONFIG.PRIMARY_COLOR,
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFF",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: "#4CAF50",
  },
  statusInactive: {
    backgroundColor: "#F44336",
  },
  statusText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  userTypeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
  },
  userTypeText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  infoRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "400",
  },
  infoValueSmall: {
    fontSize: 12,
    color: "#666",
    fontWeight: "400",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  guardianList: {
    marginTop: 4,
  },
  subjectsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  subjectBadge: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subjectText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

