import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { APP_CONFIG, API_CONFIG } from "@/src/constants/config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/src/contexts/AuthContext";
import { PostService } from "@/src/services/api";
import { router, useLocalSearchParams } from "expo-router";

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
  });

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      setLoadingPost(true);
      const response = await PostService.getPostById(id, token || undefined);
      
      if (response && response.post) {
        const post = response.post;
        setFormData({
          title: post.title || "",
          excerpt: post.excerpt || post.content || "",
        });
        
        // Carregar imagem original se existir
        if (post.imageSrc) {
          const imageUrl = (() => {
            const imagePath = post.imageSrc.trim();
            if (imagePath.includes("http")) return imagePath;
            const baseURL = API_CONFIG.BASE_URL.replace("/api", "");
            return imagePath.startsWith("/") 
              ? `${baseURL}${imagePath}` 
              : `${baseURL}/uploads/${imagePath}`;
          })();
          setSelectedImage(imageUrl);
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível carregar o post",
        position: "top",
      });
      router.back();
    } finally {
      setLoadingPost(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    try {
      // Solicitar permissão para acessar a galeria
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Toast.show({
          type: "error",
          text1: "Permissão necessária",
          text2: "Precisamos de permissão para acessar suas fotos!",
          position: "top",
        });
        return;
      }

      // Abrir seletor de imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao selecionar imagem",
        text2: "Tente novamente.",
        position: "top",
      });
    }
  };

  const handleUpdatePost = async () => {
    // Validações específicas com mensagens personalizadas
    const titleTrimmed = formData.title.trim();
    const excerptTrimmed = formData.excerpt.trim();
    const hasImage = !!selectedImage;
    const hasTitle = !!titleTrimmed;
    const hasExcerpt = !!excerptTrimmed;

    // Verificar se todos os campos estão vazios
    if (!hasImage && !hasTitle && !hasExcerpt) {
      Toast.show({
        type: "error",
        text1: "Campos imagem, título e descrição são obrigatórios",
        position: "top",
      });
      return;
    }

    // Verificar combinações de 2 campos vazios
    if (!hasImage && !hasTitle && hasExcerpt) {
      Toast.show({
        type: "error",
        text1: "Campos imagem e título são obrigatórios",
        position: "top",
      });
      return;
    }

    if (!hasImage && hasTitle && !hasExcerpt) {
      Toast.show({
        type: "error",
        text1: "Campos imagem e descrição são obrigatórios",
        position: "top",
      });
      return;
    }

    if (hasImage && !hasTitle && !hasExcerpt) {
      Toast.show({
        type: "error",
        text1: "Campos título e descrição são obrigatórios",
        position: "top",
      });
      return;
    }

    // Verificar campos individuais vazios
    if (!hasImage) {
      Toast.show({
        type: "error",
        text1: "Imagem é obrigatória",
        position: "top",
      });
      return;
    }

    if (!hasTitle) {
      Toast.show({
        type: "error",
        text1: "Título é obrigatório",
        position: "top",
      });
      return;
    }

    if (!hasExcerpt) {
      Toast.show({
        type: "error",
        text1: "Descrição é obrigatória",
        position: "top",
      });
      return;
    }

    // Verificar tamanho mínimo da descrição
    if (excerptTrimmed.length < 50) {
      Toast.show({
        type: "error",
        text1: "Descrição deve ter pelo menos 50 caracteres",
        position: "top",
      });
      return;
    }

    if (!token || !id) {
      Toast.show({
        type: "error",
        text1: "Token de autenticação não encontrado",
        position: "top",
      });
      return;
    }

    try {
      setLoading(true);

      // Criar FormData para upload de imagem
      const formDataToSend = new FormData();
      formDataToSend.append("title", titleTrimmed);
      formDataToSend.append("excerpt", excerptTrimmed);
      formDataToSend.append("content", excerptTrimmed); // Usar excerpt como content
      
      // Verificar se a imagem foi alterada (nova imagem selecionada)
      // Se selectedImage não é uma URL HTTP, significa que é uma nova imagem do dispositivo
      if (selectedImage && !selectedImage.startsWith("http")) {
        // Nova imagem selecionada do dispositivo
        formDataToSend.append("image", {
          uri: selectedImage,
          type: "image/jpeg",
          name: "post-image.jpg",
        } as any);
      } else if (selectedImage && selectedImage.startsWith("http")) {
        // Imagem original (URL) - enviar como imageSrc
        formDataToSend.append("imageSrc", selectedImage);
      }

      // Chamar a API para atualizar o post
      await PostService.updatePostWithImage(formDataToSend, id, token);

      // Mostrar mensagem de sucesso
      Toast.show({
        type: "success",
        text1: "Post editado com sucesso!",
        position: "top",
      });

      // Redirecionar para a home após um pequeno delay
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao editar post",
        text2: error.message || "Tente novamente.",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Carregando post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        {/* Botão de voltar */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card principal com gradiente */}
          <LinearGradient
            colors={["#FF8A65", "#FF6B35"]}
            style={styles.gradientCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Título */}
            <Text style={styles.cardTitle}>Editar Post</Text>

            {/* Campo Imagem */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Imagem</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {selectedImage ? (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.selectedImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <FontAwesome name="camera" size={32} color="#999" />
                    <Text style={styles.imagePlaceholderText}>
                      Toque para selecionar uma imagem
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Campo Título */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Digite o título do post"
                placeholderTextColor="#999"
                value={formData.title}
                onChangeText={(value) => handleInputChange("title", value)}
                maxLength={100}
              />
            </View>

            {/* Campo Descrição */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Digite a descrição do post (mínimo 50 caracteres)"
                placeholderTextColor="#999"
                value={formData.excerpt}
                onChangeText={(value) => handleInputChange("excerpt", value)}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>
          </LinearGradient>

          {/* Botão Editar */}
          <TouchableOpacity
            style={[
              styles.createButton,
              loading && styles.createButtonDisabled,
            ]}
            onPress={handleUpdatePost}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ["#CCC", "#999"] : ["#FF8A65", "#FF6B35"]}
              style={styles.createButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Text style={styles.createButtonText}>
                {loading ? "Editando..." : "Editar"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  keyboardAvoidingView: {
    flex: 1,
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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 40,
  },
  gradientCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 8,
  },
  imagePicker: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  titleInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    height: 50,
  },
  descriptionInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    minHeight: 120,
    textAlignVertical: "top",
  },
  createButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
});

