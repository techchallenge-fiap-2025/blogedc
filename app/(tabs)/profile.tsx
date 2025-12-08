import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { APP_CONFIG, API_CONFIG } from "@/src/constants/config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/src/contexts/AuthContext";
import { CustomHeader } from "@/src/components/common/CustomHeader";
import { ProtectedRoute } from "@/src/components/common/ProtectedRoute";
import { PostService } from "@/src/services/api";

interface UserProfile {
  id: string;
  name: string;
  bio: string;
  school: string;
  class: string;
  guardian: string[];
  age: string;
  avatar: string;
}

interface UserPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  imageSrc: string;
  likes: number;
  comments: number;
  tags: string[];
  author: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    userType: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProfileScreen() {
  const { user, logout, token } = useAuth();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);

      if (user?.userType === "professor" || user?.userType === "admin") {
        // Carregar posts reais do professor/admin
        const response = await PostService.getUserPosts(user._id, token);
        setPosts(response.posts || []);
      } else {
        // Para alunos, não carregar posts
        setPosts([]);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar posts quando a tela receber foco (incluindo após criar um post, curtir ou comentar)
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Tela de perfil recebeu foco - recarregando posts");
      if (user && token) {
        loadProfile();
      }
    }, [user?._id, token])
  );

  const handleEditProfile = () => {
    console.log("Editar perfil");
  };

  const handlePostPress = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Usuário não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container}>
        {/* Header personalizado */}
        <CustomHeader title="Perfil" showSearch={false} onLogout={handleLogout} />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Foto de perfil */}
          <View style={styles.profileImageContainer}>
            {user?.profileImage && user.profileImage.trim() !== "" ? (
              <Image
                source={{
                  uri: (() => {
                    const imagePath = user.profileImage.trim();
                    if (imagePath.includes("http")) return imagePath;
                    const baseURL = API_CONFIG.BASE_URL.replace("/api", "");
                    return imagePath.startsWith("/") 
                      ? `${baseURL}${imagePath}` 
                      : `${baseURL}/uploads/${imagePath}`;
                  })(),
                }}
                style={styles.profileImage}
                onError={() => {
                  // Se a imagem falhar ao carregar, o componente vai mostrar o placeholder
                  console.log("Erro ao carregar imagem de perfil");
                }}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>
                  {user?.name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>

          {/* Informações do usuário */}
          <View style={styles.userInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome:</Text>
              <Text style={styles.infoValue}>{user?.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue}>
                {user?.userType === "professor"
                  ? "Professor"
                  : user?.userType === "admin"
                  ? "Administrador"
                  : "Aluno"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Escola:</Text>
              <Text style={styles.infoValue}>{user?.school}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Idade:</Text>
              <Text style={styles.infoValue}>{user?.age} anos</Text>
            </View>

            {user?.userType === "aluno" && user?.class && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Turma:</Text>
                <Text style={styles.infoValue}>{user.class}</Text>
              </View>
            )}

            {user?.userType === "aluno" && user?.guardian && user.guardian.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {user.guardian.length > 1 ? "Responsáveis:" : "Responsável:"}
                </Text>
                <Text style={styles.infoValue}>
                  {Array.isArray(user.guardian) ? user.guardian.join(", ") : user.guardian}
                </Text>
              </View>
            )}

            {user?.userType === "professor" &&
              user?.subjects &&
              user?.subjects.length > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Matérias:</Text>
                  <Text style={styles.infoValue}>
                    {user.subjects.join(", ")}
                  </Text>
                </View>
              )}
          </View>

          {/* Seção de Posts */}
          <View style={styles.postsSection}>
            <Text style={styles.postsTitle}>Posts:</Text>
            <View style={styles.postsContainer}>
              {user.userType === "professor" || user.userType === "admin" ? (
                posts.length > 0 ? (
                  posts.map((post) => (
                    <TouchableOpacity
                      key={post._id}
                      style={styles.postCard}
                      onPress={() => handlePostPress(post._id)}
                    >
                      {post.imageSrc && (
                        <Image
                          source={{
                            uri: (() => {
                              const imagePath = post.imageSrc.trim();
                              if (imagePath.includes("http")) return imagePath;
                              const baseURL = API_CONFIG.BASE_URL.replace("/api", "");
                              return imagePath.startsWith("/") 
                                ? `${baseURL}${imagePath}` 
                                : `${baseURL}/uploads/${imagePath}`;
                            })(),
                          }}
                          style={styles.postImage}
                        />
                      )}
                      <Text style={styles.postTitle}>{post.title}</Text>
                      <View style={styles.postActions}>
                        <View style={styles.postAction}>
                          <FontAwesome
                            name="comment"
                            size={16}
                            color={APP_CONFIG.PRIMARY_COLOR}
                          />
                          <Text style={styles.postActionText}>
                            {post.comments}
                          </Text>
                        </View>
                        <View style={styles.postAction}>
                          <FontAwesome
                            name="heart"
                            size={16}
                            color={APP_CONFIG.PRIMARY_COLOR}
                          />
                          <Text style={styles.postActionText}>
                            {post.likes}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyPostsContainer}>
                    <FontAwesome
                      name="file-text-o"
                      size={48}
                      color={APP_CONFIG.PRIMARY_COLOR}
                      style={styles.emptyPostsIcon}
                    />
                    <Text style={styles.emptyPostsTitle}>
                      Nenhum post criado ainda
                    </Text>
                    <Text style={styles.emptyPostsText}>
                      Você ainda não criou nenhum post. Use o botão "+" na tela
                      inicial para criar seu primeiro post.
                    </Text>
                  </View>
                )
              ) : (
                <View style={styles.studentMessageContainer}>
                  <FontAwesome
                    name="graduation-cap"
                    size={48}
                    color={APP_CONFIG.PRIMARY_COLOR}
                    style={styles.studentIcon}
                  />
                  <Text style={styles.studentMessageTitle}>
                    Você é um Estudante
                  </Text>
                  <Text style={styles.studentMessageText}>
                    Como estudante, você não cria posts. Você pode visualizar e
                    interagir com os posts criados pelos professores na tela
                    inicial.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileImageContainer: {
    alignItems: "center",
    marginTop: 20, // Aumentado o espaço do topo (antes era -50)
    marginBottom: 20,
    paddingTop: 20, // Espaço adicional para dar mais destaque à imagem
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFF",
    backgroundColor: "#FFF",
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
  },
  profileImageText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFF",
  },
  userInfoContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    width: 100,
  },
  infoValue: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  guardianContainer: {
    flex: 1,
  },
  postsSection: {
    marginBottom: 20,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  postsContainer: {
    flexDirection: "column",
  },
  postCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  postAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  postActionText: {
    fontSize: 14,
    color: APP_CONFIG.PRIMARY_COLOR,
    marginLeft: 4,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  studentMessageContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  studentIcon: {
    marginBottom: 16,
  },
  studentMessageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  studentMessageText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  emptyPostsContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyPostsIcon: {
    marginBottom: 16,
  },
  emptyPostsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyPostsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
