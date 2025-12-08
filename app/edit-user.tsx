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
import { router, useLocalSearchParams } from "expo-router";
import { UserService } from "@/src/services/api";

type UserType = "professor" | "aluno" | "admin";

export default function EditUserScreen() {
  const { token } = useAuth();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [showSecondGuardian, setShowSecondGuardian] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    school: "",
    age: "",
    // Campos específicos de aluno
    class: "",
    guardian: "", // Primeiro responsável
    guardian2: "", // Segundo responsável (opcional)
    // Campos específicos de professor
    subjects: "",
  });
  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(null);

  // Carregar dados do usuário
  useEffect(() => {
    if (userId && token) {
      loadUserData();
    }
  }, [userId, token]);

  const loadUserData = async () => {
    try {
      setLoadingUser(true);
      const response = await UserService.getUserById(userId!, token!);
      const user = response.user;

      // Preencher formulário com dados do usuário
      setUserType(user.userType as UserType);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        school: user.school || "",
        age: user.age?.toString() || "",
        class: user.class || "",
        guardian: Array.isArray(user.guardian) && user.guardian.length > 0 ? user.guardian[0] : "",
        guardian2: Array.isArray(user.guardian) && user.guardian.length > 1 ? user.guardian[1] : "",
        subjects: Array.isArray(user.subjects) ? user.subjects.join(", ") : "",
      });

      // Configurar imagem de perfil atual
      if (user.profileImage) {
        const imagePath = user.profileImage.trim();
        if (imagePath.includes("http")) {
          setCurrentProfileImage(imagePath);
        } else {
          const baseURL = API_CONFIG.BASE_URL.replace("/api", "");
          setCurrentProfileImage(imagePath.startsWith("/") 
            ? `${baseURL}${imagePath}` 
            : `${baseURL}/uploads/${imagePath}`);
        }
      }

      // Mostrar segundo responsável se existir
      if (Array.isArray(user.guardian) && user.guardian.length > 1) {
        setShowSecondGuardian(true);
      }
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
      setLoadingUser(false);
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

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
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

  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
      console.log("🔍 uploadImage: Iniciando upload da imagem");

      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const uploadUrl = `${API_CONFIG.BASE_URL}/upload/image`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("❌ uploadImage: Erro ao parsear JSON:", parseError);
        throw new Error("Erro ao processar resposta do servidor");
      }

      if (!response.ok || !data.success) {
        const errorMessage = data.message || "Erro ao fazer upload da imagem";
        throw new Error(errorMessage);
      }

      if (data.data?.filename) {
        const imagePath = `images/${data.data.filename}`;
        return imagePath;
      }
      
      if (data.data?.url) {
        const url = data.data.url;
        if (url.includes("/uploads/images/")) {
          const imagePath = `images/${url.split("/uploads/images/")[1]}`;
          return imagePath;
        }
      }
      
      return null;
    } catch (error: any) {
      console.error("❌ uploadImage: Erro completo:", error);
      throw error;
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Toast.show({
        type: "error",
        text1: "Nome completo é obrigatório",
        position: "top",
      });
      return false;
    }

    if (!formData.email.trim()) {
      Toast.show({
        type: "error",
        text1: "E-mail é obrigatório",
        position: "top",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Toast.show({
        type: "error",
        text1: "E-mail incorreto",
        position: "top",
      });
      return false;
    }

    if (!formData.email.trim().includes(".com")) {
      Toast.show({
        type: "error",
        text1: "E-mail incorreto",
        position: "top",
      });
      return false;
    }

    if (!formData.school.trim()) {
      Toast.show({
        type: "error",
        text1: "Escola é obrigatória",
        position: "top",
      });
      return false;
    }

    if (!formData.age.trim() || isNaN(Number(formData.age))) {
      Toast.show({
        type: "error",
        text1: "Idade é obrigatória",
        text2: "A idade deve ser um número válido",
        position: "top",
      });
      return false;
    }

    // Validações específicas por tipo de usuário
    if (userType === "aluno") {
      if (!formData.class.trim() || !formData.guardian.trim()) {
        Toast.show({
          type: "error",
          text1: "Turma e Responsável é obrigatório",
          position: "top",
        });
        return false;
      }
      if (showSecondGuardian && !formData.guardian2.trim()) {
        Toast.show({
          type: "error",
          text1: "Segundo responsável é obrigatório",
          position: "top",
        });
        return false;
      }
    } else if (userType === "professor") {
      if (!formData.subjects.trim()) {
        Toast.show({
          type: "error",
          text1: "Matéria é obrigatória",
          position: "top",
        });
        return false;
      }
    }

    return true;
  };

  const handleUpdateUser = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Fazer upload da imagem se houver uma nova selecionada
      let profileImage = null;
      if (selectedImage) {
        try {
          const uploadedImage = await uploadImage(selectedImage);
          if (uploadedImage) {
            profileImage = uploadedImage;
          } else {
            Toast.show({
              type: "warning",
              text1: "Aviso",
              text2: "Não foi possível fazer upload da imagem",
              position: "top",
            });
          }
        } catch (uploadError: any) {
          console.error("❌ Erro no upload da imagem:", uploadError);
          Toast.show({
            type: "warning",
            text1: "Aviso",
            text2: uploadError.message || "Erro ao fazer upload da imagem",
            position: "top",
          });
        }
      }

      // Preparar dados do usuário
      const userData: any = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        school: formData.school.trim(),
        age: Number(formData.age),
      };

      if (profileImage) {
        userData.profileImage = profileImage;
      }

      // Adicionar campos específicos
      if (userType === "aluno") {
        userData.class = formData.class.trim();
        const guardians = [formData.guardian.trim()];
        if (showSecondGuardian && formData.guardian2.trim()) {
          guardians.push(formData.guardian2.trim());
        }
        userData.guardian = guardians;
      } else if (userType === "professor") {
        userData.subjects = formData.subjects
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }

      // Chamar API de atualização
      const baseURL = API_CONFIG.BASE_URL.replace("localhost", "127.0.0.1");
      const response = await fetch(`${baseURL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("❌ Erro ao parsear JSON:", parseError);
        throw new Error("Erro ao processar resposta do servidor");
      }

      if (!response.ok || !data.success) {
        let errorMessage = data.message || data.error || "Erro ao atualizar usuário";
        
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          errorMessage = data.errors[0];
        }
        
        throw new Error(errorMessage);
      }

      Toast.show({
        type: "success",
        text1: "Usuário atualizado com sucesso!",
        position: "top",
      });

      router.back();
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      Toast.show({
        type: "error",
        text1: error.message || "Erro ao atualizar usuário",
        text2: "Tente novamente",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Carregando dados do usuário...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com botão de voltar */}
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
          <Text style={styles.headerTitle}>Editar Usuário</Text>
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
          {/* Tipo de Usuário (apenas texto) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Usuário</Text>
            <View style={styles.userTypeContainer}>
              <Text style={styles.userTypeText}>
                {userType === "professor"
                  ? "Professor"
                  : userType === "aluno"
                  ? "Aluno"
                  : userType === "admin"
                  ? "Administrador"
                  : ""}
              </Text>
            </View>
          </View>

          {/* Imagem de Perfil */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imagem de Perfil</Text>
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={pickImage}
              disabled={loading}
            >
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.image} />
              ) : currentProfileImage ? (
                <Image source={{ uri: currentProfileImage }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <FontAwesome name="camera" size={32} color="#999" />
                  <Text style={styles.imagePlaceholderText}>
                    Adicionar foto
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Campos Comuns */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome completo *"
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="E-mail *"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Escola *"
              value={formData.school}
              onChangeText={(value) => handleInputChange("school", value)}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Idade *"
              value={formData.age}
              onChangeText={(value) => handleInputChange("age", value)}
              keyboardType="numeric"
            />
          </View>

          {/* Campos Específicos de Aluno */}
          {userType === "aluno" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados do Aluno</Text>

              <TextInput
                style={styles.input}
                placeholder="Turma *"
                value={formData.class}
                onChangeText={(value) => handleInputChange("class", value)}
                autoCapitalize="characters"
              />

              <TextInput
                style={styles.input}
                placeholder="Responsável *"
                value={formData.guardian}
                onChangeText={(value) => handleInputChange("guardian", value)}
                autoCapitalize="words"
              />

              {/* Botão para adicionar segundo responsável */}
              {!showSecondGuardian && (
                <TouchableOpacity
                  style={styles.addGuardianButton}
                  onPress={() => setShowSecondGuardian(true)}
                >
                  <Text style={styles.addGuardianButtonText}>
                    Aluno tem mais de 1 responsável
                  </Text>
                </TouchableOpacity>
              )}

              {/* Segundo campo de responsável */}
              {showSecondGuardian && (
                <View style={styles.secondGuardianContainer}>
                  <TextInput
                    style={[styles.input, styles.secondGuardianInput]}
                    placeholder="Segundo Responsável *"
                    value={formData.guardian2}
                    onChangeText={(value) => handleInputChange("guardian2", value)}
                    autoCapitalize="words"
                  />
                  <TouchableOpacity
                    style={styles.removeGuardianButton}
                    onPress={() => {
                      setShowSecondGuardian(false);
                      handleInputChange("guardian2", "");
                    }}
                  >
                    <FontAwesome name="times" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Campos Específicos de Professor */}
          {userType === "professor" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados do Professor</Text>

              <TextInput
                style={styles.input}
                placeholder="Matérias (separadas por vírgula) *"
                value={formData.subjects}
                onChangeText={(value) => handleInputChange("subjects", value)}
                autoCapitalize="words"
                multiline
              />
              <Text style={styles.hint}>
                Exemplo: Matemática, Português, História
              </Text>
            </View>
          )}

          {/* Botão de Atualizar */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.createButton, loading && styles.buttonDisabled]}
              onPress={handleUpdateUser}
              disabled={loading}
            >
              <LinearGradient
                colors={["#FF6B35", "#FF8A65"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Atualizando..." : "Atualizar Usuário"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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
    fontSize: 24,
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
  userTypeContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  userTypeText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  imagePicker: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: APP_CONFIG.PRIMARY_COLOR,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#CCC",
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: "#999",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: -8,
    marginBottom: 8,
    fontStyle: "italic",
  },
  addGuardianButton: {
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  addGuardianButtonText: {
    fontSize: 14,
    color: APP_CONFIG.PRIMARY_COLOR,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  secondGuardianContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  secondGuardianInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeGuardianButton: {
    marginLeft: 8,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    padding: 16,
    marginBottom: 32,
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
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
});


