import React, { useState } from "react";
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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { APP_CONFIG, API_CONFIG } from "@/src/constants/config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/src/contexts/AuthContext";
import { router } from "expo-router";

type UserType = "professor" | "aluno" | null;

export default function AddUserScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [showSecondGuardian, setShowSecondGuardian] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    school: "",
    age: "",
    // Campos específicos de aluno
    class: "",
    guardian: "", // Primeiro responsável
    guardian2: "", // Segundo responsável (opcional)
    // Campos específicos de professor
    subjects: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUserTypeChange = (type: UserType) => {
    setUserType(type);
    // Resetar estado do segundo responsável quando mudar o tipo de usuário
    setShowSecondGuardian(false);
    // Limpar campos específicos do tipo anterior
    setFormData((prev) => ({
      ...prev,
      class: "",
      guardian: "",
      guardian2: "",
      subjects: "",
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
      console.log("🔍 uploadImage: imageUri:", imageUri);

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
      console.log("🔍 uploadImage: URL:", uploadUrl);
      console.log("🔍 uploadImage: Token disponível:", !!token);

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("🔍 uploadImage: Response status:", response.status);
      console.log("🔍 uploadImage: Response ok:", response.ok);

      let data;
      try {
        data = await response.json();
        console.log("🔍 uploadImage: Response data:", data);
      } catch (parseError) {
        console.error("❌ uploadImage: Erro ao parsear JSON:", parseError);
        throw new Error("Erro ao processar resposta do servidor");
      }

      if (!response.ok || !data.success) {
        const errorMessage = data.message || "Erro ao fazer upload da imagem";
        console.error("❌ uploadImage: Erro do servidor:", errorMessage);
        throw new Error(errorMessage);
      }

      // A resposta retorna data.url (URL completa) ou data.filename
      // Precisamos retornar o caminho relativo para salvar no banco
      // O formato esperado é: images/filename.jpg
      if (data.data?.filename) {
        const imagePath = `images/${data.data.filename}`;
        console.log("✅ uploadImage: Upload bem-sucedido:", imagePath);
        return imagePath;
      }
      
      if (data.data?.url) {
        // Extrair o caminho relativo da URL completa
        const url = data.data.url;
        if (url.includes("/uploads/images/")) {
          const imagePath = `images/${url.split("/uploads/images/")[1]}`;
          console.log("✅ uploadImage: Upload bem-sucedido (via URL):", imagePath);
          return imagePath;
        }
      }
      
      console.warn("⚠️ uploadImage: Nenhum caminho encontrado na resposta");
      return null;
    } catch (error: any) {
      console.error("❌ uploadImage: Erro completo:", error);
      throw error; // Re-throw para que o erro seja tratado no handleCreateUser
    }
  };

  const validateForm = (): boolean => {
    // 1. Validar tipo de usuário
    if (!userType) {
      Toast.show({
        type: "error",
        text1: "Escolha um tipo de usuário",
        position: "top",
      });
      return false;
    }

    // 2. Verificar se todos os campos estão vazios
    const allFieldsEmpty =
      !formData.name.trim() &&
      !formData.email.trim() &&
      !formData.password.trim() &&
      !formData.school.trim() &&
      !formData.age.trim() &&
      (userType === "aluno"
        ? !formData.class.trim() && !formData.guardian.trim()
        : !formData.subjects.trim());

    if (allFieldsEmpty) {
      Toast.show({
        type: "error",
        text1: "Todos os campos são obrigatórios",
        position: "top",
      });
      return false;
    }

    // 3. Validar campos obrigatórios comuns
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

    // 4. Validar formato de e-mail (deve ter @ e .com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Toast.show({
        type: "error",
        text1: "E-mail incorreto",
        position: "top",
      });
      return false;
    }

    // Verificar se tem .com especificamente
    if (!formData.email.trim().includes(".com")) {
      Toast.show({
        type: "error",
        text1: "E-mail incorreto",
        position: "top",
      });
      return false;
    }

    // 5. Validar senha com requisitos específicos
    if (!formData.password.trim()) {
      Toast.show({
        type: "error",
        text1: "Senha é obrigatória",
        position: "top",
      });
      return false;
    }

    const password = formData.password.trim();
    let passwordError = "";

    // Verificar comprimento mínimo
    if (password.length < 6) {
      passwordError = "Senha deve ter pelo menos 6 caracteres";
    }
    // Verificar se tem letra
    else if (!/[a-zA-Z]/.test(password)) {
      passwordError = "Senha deve ter 1 letra";
    }
    // Verificar se tem número
    else if (!/[0-9]/.test(password)) {
      passwordError = "Senha deve ter 1 número";
    }
    // Verificar se tem caractere especial
    else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      passwordError = "Senha deve ter 1 caracter especial";
    }

    if (passwordError) {
      Toast.show({
        type: "error",
        text1: passwordError,
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

    // 6. Validações específicas por tipo de usuário
    if (userType === "aluno") {
      // Validar turma e primeiro responsável (obrigatório)
      if (!formData.class.trim() || !formData.guardian.trim()) {
        Toast.show({
          type: "error",
          text1: "Turma e Responsável é obrigatório",
          position: "top",
        });
        return false;
      }
      // Se o segundo responsável estiver visível, ele também deve ser preenchido
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

  const handleCreateUser = async () => {
    // Validar formulário (inclui validação de tipo de usuário)
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Fazer upload da imagem se houver
      let profileImage = null;
      if (selectedImage) {
        try {
          const uploadedImage = await uploadImage(selectedImage);
          if (uploadedImage) {
            profileImage = uploadedImage;
            console.log("✅ Imagem enviada com sucesso:", profileImage);
          } else {
            Toast.show({
              type: "warning",
              text1: "Aviso",
              text2: "Não foi possível fazer upload da imagem, mas o usuário será criado sem foto",
              position: "top",
            });
          }
        } catch (uploadError: any) {
          console.error("❌ Erro no upload da imagem:", uploadError);
          Toast.show({
            type: "warning",
            text1: "Aviso",
            text2: uploadError.message || "Erro ao fazer upload da imagem. O usuário será criado sem foto.",
            position: "top",
          });
          // Continuar sem imagem - não bloquear a criação do usuário
        }
      }

      // Preparar dados do usuário
      const userData: any = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        school: formData.school.trim(),
        age: Number(formData.age),
        userType,
      };

      if (profileImage) {
        userData.profileImage = profileImage;
      }

      // Adicionar campos específicos
      if (userType === "aluno") {
        userData.class = formData.class.trim();
        // Sempre enviar como array de responsáveis
        const guardians = [formData.guardian.trim()];
        if (showSecondGuardian && formData.guardian2.trim()) {
          guardians.push(formData.guardian2.trim());
        }
        userData.guardian = guardians;
      } else if (userType === "professor") {
        // Separar matérias por vírgula e limpar espaços
        userData.subjects = formData.subjects
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }

      // Chamar API de registro (rota pública, mas enviamos token para validação se necessário)
      const baseURL = API_CONFIG.BASE_URL.replace("/api", "");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Adicionar token se disponível (para futura validação de admin)
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log("🔍 Enviando dados para registro:", {
        ...userData,
        password: "***", // Não logar senha
        guardian: userData.guardian,
        guardianType: Array.isArray(userData.guardian) ? "array" : typeof userData.guardian,
        guardianLength: Array.isArray(userData.guardian) ? userData.guardian.length : "N/A",
      });

      const response = await fetch(`${baseURL}/users/register`, {
        method: "POST",
        headers,
        body: JSON.stringify(userData),
      });

      console.log("🔍 Response status:", response.status);
      console.log("🔍 Response ok:", response.ok);

      let data;
      try {
        data = await response.json();
        console.log("🔍 Response data:", data);
      } catch (parseError) {
        console.error("❌ Erro ao parsear JSON:", parseError);
        throw new Error("Erro ao processar resposta do servidor");
      }

      if (!response.ok || !data.success) {
        // Se houver erros de validação específicos, mostrar o primeiro
        let errorMessage = data.message || data.error || "Erro ao criar usuário";
        
        // Se houver array de erros, usar o primeiro
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          errorMessage = data.errors[0];
        }
        
        console.error("❌ Erro do servidor:", errorMessage);
        console.error("❌ Detalhes completos:", data);
        throw new Error(errorMessage);
      }

      Toast.show({
        type: "success",
        text1: "Usuário criado com sucesso!",
        position: "top",
      });

      // Voltar para a tela anterior
      router.back();
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      Toast.show({
        type: "error",
        text1: error.message || "Erro ao criar usuário",
        text2: "Tente novamente",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Adicionar Usuário</Text>
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
          {/* Seleção de Tipo de Usuário */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Usuário *</Text>
            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => handleUserTypeChange("professor")}
              >
                <View style={styles.radioCircle}>
                  {userType === "professor" && (
                    <View style={styles.radioSelected} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Professor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => handleUserTypeChange("aluno")}
              >
                <View style={styles.radioCircle}>
                  {userType === "aluno" && (
                    <View style={styles.radioSelected} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Aluno</Text>
              </TouchableOpacity>
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
              placeholder="Senha *"
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
              secureTextEntry
              autoCapitalize="none"
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

              {/* Segundo campo de responsável (aparece quando o botão é clicado) */}
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

          {/* Botão de Criar */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.createButton, loading && styles.buttonDisabled]}
              onPress={handleCreateUser}
              disabled={loading}
            >
              <LinearGradient
                colors={["#FF6B35", "#FF8A65"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Criando..." : "Criar Usuário"}
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
  header: {
    paddingTop: 50, // Para status bar
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
    width: 40, // Mesmo tamanho do botão de voltar para centralizar o título
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
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: APP_CONFIG.PRIMARY_COLOR,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
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

