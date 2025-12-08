import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { APP_CONFIG, API_CONFIG } from "@/src/constants/config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/src/contexts/AuthContext";
import { CustomHeader } from "@/src/components/common/CustomHeader";
import { PostService, UserService } from "@/src/services/api";
import { User } from "@/src/types";

interface UserPost {
  _id: string;
  id: string;
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

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { token } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && token) {
      loadUserProfile();
    }
  }, [userId, token]);

  // Recarregar posts quando a tela receber foco (após curtir ou comentar)
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Tela de perfil de usuário recebeu foco - recarregando posts");
      if (userId && token && user) {
        // Recarregar apenas os posts, não o perfil completo
        loadUserPosts(user._id);
      }
    }, [userId, token, user?._id])
  );

  const loadUserPosts = async (targetUserId: string) => {
    if (!targetUserId || !token) return;
    
    try {
      // Carregar posts do usuário
      console.log("🔍 Recarregando posts do usuário:", targetUserId);
      const postsResponse = await PostService.getUserPosts(
        targetUserId,
        token
      );
      
      console.log("✅ Posts atualizados:", postsResponse.posts?.length || 0);
      
      if (!user) return;
      
      // Transformar posts
      const transformedPosts: UserPost[] = (postsResponse.posts || []).map((post: any) => ({
        _id: post._id || post.id,
        id: post._id || post.id,
        title: post.title,
        excerpt: post.excerpt || post.content?.substring(0, 150) || "",
        content: post.content || post.excerpt || "",
        imageSrc: post.imageSrc || post.image || "",
        likes: post.likes || 0,
        comments: post.comments || 0,
        tags: post.tags || [],
        author: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          userType: user.userType,
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }));
      
      console.log("✅ Posts transformados:", transformedPosts.length);
      setPosts(transformedPosts);
    } catch (error: any) {
      console.error("❌ Erro ao recarregar posts do usuário:", error);
      // Não mostrar erro ao usuário, apenas logar
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      if (!userId || !token) {
        throw new Error("ID do usuário ou token não disponível");
      }

      // Carregar dados do usuário
      const userResponse = await UserService.getUserById(userId, token);
      
      // Transformar dados do backend para o formato esperado
      const userData = userResponse.user;
      const transformedUser: User = {
        _id: userData._id || userData.id,
        name: userData.name,
        email: userData.email,
        userType: userData.userType,
        school: userData.school || "",
        age: userData.age || 0,
        profileImage: userData.profileImage,
        subjects: userData.subjects || [],
        class: userData.class,
        guardian: Array.isArray(userData.guardian) 
          ? userData.guardian 
          : userData.guardian 
          ? [userData.guardian] 
          : undefined,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: userData.createdAt || "",
        updatedAt: userData.updatedAt || "",
      };

      setUser(transformedUser);

      // Carregar posts do usuário (se for professor ou admin)
      if (transformedUser.userType === "professor" || transformedUser.userType === "admin") {
        try {
          console.log("🔍 Carregando posts do usuário:", transformedUser._id);
          const postsResponse = await PostService.getUserPosts(
            transformedUser._id,
            token
          );
          
          console.log("✅ Posts recebidos:", postsResponse.posts?.length || 0);
          
          // Transformar posts
          const transformedPosts: UserPost[] = (postsResponse.posts || []).map((post: any) => ({
            _id: post._id || post.id,
            id: post._id || post.id,
            title: post.title,
            excerpt: post.excerpt || post.content?.substring(0, 150) || "",
            content: post.content || post.excerpt || "",
            imageSrc: post.imageSrc || post.image || "",
            likes: post.likes || 0,
            comments: post.comments || 0,
            tags: post.tags || [],
            author: {
              _id: transformedUser._id,
              name: transformedUser.name,
              email: transformedUser.email,
              profileImage: transformedUser.profileImage,
              userType: transformedUser.userType,
            },
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
          }));
          
          console.log("✅ Posts transformados:", transformedPosts.length);
          setPosts(transformedPosts);
        } catch (error: any) {
          console.error("❌ Erro ao carregar posts do usuário:", error);
          console.error("❌ Mensagem de erro:", error.message);
          setPosts([]);
        }
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil do usuário:", error);
      Alert.alert("Erro", "Não foi possível carregar o perfil do usuário");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePostPress = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header personalizado com botão de voltar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <FontAwesome name="arrow-left" size={24} color={APP_CONFIG.PRIMARY_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.placeholder} />
      </View>

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
                    key={post._id || post.id}
                    style={styles.postCard}
                    onPress={() => handlePostPress(post._id || post.id)}
                  >
                    {post.imageSrc && (
                      <Image
                        source={{
                          uri: post.imageSrc.includes("http")
                            ? post.imageSrc
                            : (() => {
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
                    Este usuário ainda não criou nenhum post.
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
                  Este é um Estudante
                </Text>
                <Text style={styles.studentMessageText}>
                  Como estudante, este usuário não cria posts. Você pode visualizar e
                  interagir com os posts criados pelos professores na tela inicial.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backIcon: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileImageContainer: {
    alignItems: "center",
    marginTop: 20, // Aumentado o espaço do topo
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
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
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

