import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Toast from "react-native-toast-message";
import { PostService, CommentService } from "@/src/services/api";
import { Post, Comment } from "@/src/types";
import { APP_CONFIG, API_CONFIG } from "@/src/constants/config";
import { useAuth } from "@/src/contexts/AuthContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { User } from "@/src/types";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token, isAuthenticated } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Verificar se o post pertence ao usuário logado
  // Comparação precisa dos IDs do autor e do usuário logado
  const isOwner = useMemo(() => {
    if (!post || !user) return false;
    
    const authorId = post.author._id || post.author.id || "";
    const userId = user._id || user.id || "";
    
    return String(authorId) === String(userId);
  }, [post, user]);

  useEffect(() => {
    if (id) {
      loadPost();
      loadComments();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      
      // Validar ID antes de fazer a requisição
      if (!id || id.trim() === "") {
        throw new Error("ID do post inválido");
      }
      
      const response = await PostService.getPostById(id, token || undefined);
      
      // Verificar se o post foi encontrado
      if (!response || !response.post) {
        throw new Error("Post não encontrado");
      }
      
      // Transformar dados do backend para o formato esperado
      const postData = response.post;
      
      // Transformar autor para garantir que tenha _id
      const authorData = postData.author || {};
      const transformedAuthor: User = {
        _id: authorData._id || authorData.id || "",
        name: authorData.name || "Desconhecido",
        email: authorData.email || "",
        userType: authorData.userType || "aluno",
        school: authorData.school || "",
        age: authorData.age || 0,
        profileImage: authorData.profileImage,
        subjects: authorData.subjects || [],
        class: authorData.class,
        guardian: Array.isArray(authorData.guardian) 
          ? authorData.guardian 
          : authorData.guardian 
          ? [authorData.guardian] 
          : undefined,
        isActive: authorData.isActive !== undefined ? authorData.isActive : true,
        createdAt: authorData.createdAt || "",
        updatedAt: authorData.updatedAt || "",
      };
      
      const transformedPost: Post = {
        id: postData._id || postData.id,
        title: postData.title,
        content: postData.content || postData.excerpt || "",
        excerpt: postData.excerpt || postData.content?.substring(0, 150) || "",
        author: transformedAuthor,
        imageSrc: postData.imageSrc || postData.image || "",
        tags: postData.tags || [],
        likes: postData.likes || 0,
        comments: postData.comments || 0,
        isLiked: postData.userLiked || false,
        createdAt: postData.createdAt,
        updatedAt: postData.updatedAt,
      };
      
      setPost(transformedPost);
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Não foi possível carregar o post",
          position: "top",
        });
        router.back();
      } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await CommentService.getComments(id, token || undefined);
      
      // Transformar comentários do backend
      const transformedComments: Comment[] = (response.comments || []).map((comment: any) => ({
        id: comment._id || comment.id,
        content: comment.content,
        author: comment.author || {
          _id: "",
          name: "Desconhecido",
          email: "",
          userType: "aluno",
          school: "",
          age: 0,
          isActive: true,
          createdAt: "",
          updatedAt: "",
        },
        postId: id,
        likes: comment.likes || 0,
        isLiked: comment.userLiked || false,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      }));
      
      setComments(transformedComments);
    } catch (error) {
      // Erro silencioso ao carregar comentários
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !token) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Você precisa estar logado para curtir posts",
        position: "top",
      });
      return;
    }

    try {
      await PostService.likePost(id, token);
      
      // Atualizar estado local
      setPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isLiked: !prev.isLiked,
          likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
        };
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível curtir o post",
        position: "top",
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated || !token) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Você precisa estar logado para comentar",
        position: "top",
      });
      return;
    }

    if (!commentText.trim()) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Escreva algo antes de comentar",
        position: "top",
      });
      return;
    }

    try {
      setSubmittingComment(true);
      await CommentService.createComment(id, commentText.trim(), token);
      
      // Limpar campo e recarregar comentários
      setCommentText("");
      await loadComments();
      
      // Atualizar contador de comentários no post
      setPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments + 1,
        };
      });
    } catch (error: any) {
      const errorMessage = error.message || "Não foi possível adicionar o comentário";
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: errorMessage,
        position: "top",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated || !token) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Você precisa estar logado para curtir comentários",
        position: "top",
      });
      return;
    }

    try {
      await CommentService.likeComment(commentId, token);
      
      // Atualizar estado local
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              }
            : comment
        )
      );
    } catch (error) {
      // Erro silencioso ao curtir comentário
    }
  };

  const handleDeletePost = () => {
    if (!token || !id) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível deletar o post",
        position: "top",
      });
      return;
    }

    // Mostrar modal de confirmação
    setShowDeleteConfirm(true);
  };

  const confirmDeletePost = async () => {
    if (!token || !id) return;

    try {
      setShowDeleteConfirm(false);
      await PostService.deletePost(id, token);
      
      Toast.show({
        type: "success",
        text1: "Post deletado com sucesso!",
        position: "top",
      });

      // Redirecionar para a tela principal após um pequeno delay
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao deletar post",
        text2: error.message || "Não foi possível deletar o post",
        position: "top",
      });
    }
  };

  const handleEditPost = () => {
    if (!id) return;
    router.push(`/edit-post?id=${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Carregando post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Post não encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <FontAwesome name="arrow-left" size={24} color={APP_CONFIG.PRIMARY_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Post</Text>
        {isOwner ? (
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            style={styles.menuIcon}
          >
            <FontAwesome name="ellipsis-v" size={24} color={APP_CONFIG.PRIMARY_COLOR} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Modal do Menu */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer} onStartShouldSetResponder={() => true}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleEditPost();
              }}
            >
              <FontAwesome name="edit" size={20} color={APP_CONFIG.PRIMARY_COLOR} />
              <Text style={styles.menuItemText}>Editar</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleDeletePost();
              }}
            >
              <FontAwesome name="trash" size={20} color="#F44336" />
              <Text style={[styles.menuItemText, styles.deleteText]}>Deletar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
            <Text style={styles.confirmTitle}>Deseja deletar o post?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Não</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton]}
                onPress={confirmDeletePost}
              >
                <Text style={styles.deleteButtonText}>Sim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <View>
              {/* RefreshControl será implementado se necessário */}
            </View>
          }
        >
          {/* Imagem do post */}
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
              resizeMode="cover"
            />
          )}

          {/* Conteúdo do post */}
          <View style={styles.content}>
            <Text style={styles.title}>{post.title}</Text>

            {/* Autor e data */}
            <View style={styles.meta}>
              <TouchableOpacity
                style={styles.authorContainer}
                onPress={() => {
                  const authorId = post.author._id || post.author.id;
                  if (authorId) {
                    router.push(`/profile/${authorId}`);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorInitials}>
                    {getInitials(post.author.name)}
                  </Text>
                </View>
                <Text style={styles.authorName}>{post.author.name}</Text>
              </TouchableOpacity>
              <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
            </View>

            {/* Conteúdo do post */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Ações */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLike}
              >
                <FontAwesome
                  name={post.isLiked ? "heart" : "heart-o"}
                  size={20}
                  color={post.isLiked ? APP_CONFIG.PRIMARY_COLOR : "#999"}
                />
                <Text
                  style={[
                    styles.actionText,
                    post.isLiked && styles.likedText,
                  ]}
                >
                  {post.likes}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionButton}>
                <FontAwesome name="comment-o" size={20} color="#999" />
                <Text style={styles.actionText}>{post.comments}</Text>
              </View>
            </View>

            {/* Seção de comentários */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>
                Comentários ({comments.length})
              </Text>

              {comments.length === 0 ? (
                <View style={styles.noComments}>
                  <Text style={styles.noCommentsText}>
                    Nenhum comentário ainda. Seja o primeiro a comentar!
                  </Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.comment}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAuthorAvatar}>
                        <Text style={styles.commentAuthorInitials}>
                          {getInitials(comment.author.name)}
                        </Text>
                      </View>
                      <View style={styles.commentInfo}>
                        <Text style={styles.commentAuthorName}>
                          {comment.author.name}
                        </Text>
                        <Text style={styles.commentDate}>
                          {formatDate(comment.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    <TouchableOpacity
                      style={styles.commentLike}
                      onPress={() => handleLikeComment(comment.id)}
                    >
                      <FontAwesome
                        name={comment.isLiked ? "heart" : "heart-o"}
                        size={14}
                        color={comment.isLiked ? APP_CONFIG.PRIMARY_COLOR : "#999"}
                      />
                      <Text
                        style={[
                          styles.commentLikeText,
                          comment.isLiked && styles.likedText,
                        ]}
                      >
                        {comment.likes}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Input de comentário */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Escreva algo..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isAuthenticated || submittingComment || !commentText.trim()) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitComment}
            disabled={!isAuthenticated || submittingComment || !commentText.trim()}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Adicionar comentario</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFF",
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
  menuIcon: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  menuContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  deleteText: {
    color: "#F44336",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  postImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#F0F0F0",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: APP_CONFIG.PRIMARY_COLOR,
    marginBottom: 16,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  authorInitials: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  actionText: {
    fontSize: 16,
    color: "#999",
    marginLeft: 8,
  },
  likedText: {
    color: APP_CONFIG.PRIMARY_COLOR,
    fontWeight: "600",
  },
  commentsSection: {
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  noComments: {
    paddingVertical: 32,
    alignItems: "center",
  },
  noCommentsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  comment: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  commentAuthorInitials: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
    marginBottom: 8,
  },
  commentLike: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  commentLikeText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
  commentInputContainer: {
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  commentInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#333",
    maxHeight: 100,
    marginBottom: 12,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#CCC",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
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

