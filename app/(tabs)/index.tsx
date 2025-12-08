import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PostCard } from "@/src/components/common/PostCard";
import { PostService } from "@/src/services/api";
import { Post } from "@/src/types";
import { APP_CONFIG } from "@/src/constants/config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { CustomHeader } from "@/src/components/common/CustomHeader";
import { useAuth } from "@/src/contexts/AuthContext";
import Toast from "react-native-toast-message";

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const loadPosts = async (showLoading = true, search?: string) => {
    try {
      if (showLoading && isFirstLoad) {
        setLoading(true);
      }
      console.log("🔍 loadPosts: Carregando posts do backend");
      console.log("🔍 loadPosts: searchQuery:", search || searchQuery);
      
      // Carregar todos os posts do banco de dados (limite alto para pegar todos)
      const response = await PostService.getPosts(1, 1000, token || undefined, search || searchQuery);
      console.log(`✅ loadPosts: ${response.posts?.length || 0} posts carregados do banco`);
      
      if (response.posts && response.posts.length > 0) {
        setPosts(response.posts);
      } else {
        console.log("⚠️ loadPosts: Nenhum post encontrado no banco de dados");
        setPosts([]);
      }
      setIsFirstLoad(false);
    } catch (error) {
      console.error("❌ loadPosts: Erro ao carregar posts:", error);
      setPosts([]);
      // Não mostrar toast em refresh silencioso
      if (showLoading) {
        Toast.show({
          type: "error",
          text1: "Erro ao carregar posts",
          text2: error instanceof Error ? error.message : "Verifique se o backend está rodando",
          position: "top",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar posts quando a tela receber foco (sem mostrar loading após primeira vez)
  // IMPORTANTE: Sempre recarregar do backend para garantir sincronização dos likes
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Tela principal recebeu foco - recarregando posts do backend");
      // Sempre recarregar do backend para garantir que os likes estejam sincronizados
      loadPosts(isFirstLoad); // Mostrar loading apenas na primeira vez
    }, [token, isFirstLoad])
  );

  // Recarregar posts quando a busca mudar (com debounce)
  useEffect(() => {
    if (!isFirstLoad) {
      // Debounce da busca - aguardar 500ms após parar de digitar
      const timeoutId = setTimeout(() => {
        console.log("🔍 Busca alterada, recarregando posts com filtro:", searchQuery);
        loadPosts(false, searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts(false); // false = não mostrar loading, apenas refresh
  };

  const handleLike = async (postId: string) => {
    if (!token) {
      console.log("Usuário não autenticado");
      return;
    }

    // Evitar múltiplos cliques simultâneos
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      console.log("🔍 Curtindo post:", postId, "Estado atual - liked:", post.isLiked, "likes:", post.likes);
      
      // Chamar o backend para dar like/deslike
      const response = await PostService.likePost(postId, token);
      
      console.log("✅ Resposta do backend:", response);
      
      // IMPORTANTE: Usar SEMPRE a resposta do backend para atualizar o estado
      // O backend retorna: { liked: boolean, likes: number, likesCount: number }
      const newLikedState = response.data?.liked ?? false;
      const newLikesCount = response.data?.likes ?? response.data?.likesCount ?? 0;
      
      console.log("✅ Novo estado do backend - liked:", newLikedState, "likes:", newLikesCount);
      
      // Atualizar estado local APENAS com os dados do backend
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: newLikedState,
                likes: newLikesCount,
              }
            : p
        )
      );
    } catch (error) {
      console.error("❌ Erro ao curtir post:", error);
      // Em caso de erro, recarregar posts do backend para garantir sincronização
      loadPosts(false);
    }
  };

  const handleComment = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const handlePostPress = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const handleAuthorPress = (authorId: string) => {
    router.push(`/profile/${authorId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header personalizado */}
      <CustomHeader
        title="Posts"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={true}
      />

      {/* Conteúdo principal */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum post encontrado</Text>
          </View>
        ) : (
          posts.map((post, index) => (
            <PostCard
              key={`${post.id}-${index}`}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              onAuthorPress={handleAuthorPress}
              onPress={() => handlePostPress(post.id)}
            />
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
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
});
