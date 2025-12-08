import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { APP_CONFIG } from "@/src/constants/config";
import { useAuth } from "@/src/contexts/AuthContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function LoginScreen() {
  // Campos vazios - usuário sempre precisa fazer login manualmente
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    // Validações específicas com mensagens personalizadas
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();

    // Caso ambos os campos estejam vazios
    if (!emailTrimmed && !passwordTrimmed) {
      Toast.show({
        type: "error",
        text1: "E-mail e senha são obrigatórios",
        position: "top",
      });
      return;
    }

    // Caso apenas o e-mail esteja vazio
    if (!emailTrimmed) {
      Toast.show({
        type: "error",
        text1: "E-mail é obrigatório",
        position: "top",
      });
      return;
    }

    // Caso apenas a senha esteja vazia
    if (!passwordTrimmed) {
      Toast.show({
        type: "error",
        text1: "Senha é obrigatória",
        position: "top",
      });
      return;
    }

    try {
      await login(emailTrimmed, passwordTrimmed);
      // O redirecionamento acontece automaticamente através do contexto de autenticação
      // Não precisamos de confirmação manual
      Toast.show({
        type: "success",
        text1: "Login realizado com sucesso!",
        position: "top",
      });
    } catch (error: any) {
      // Mostrar mensagem de erro específica
      const errorMessage = error.message || "Erro ao fazer login";
      console.error("❌ Erro no login:", errorMessage);
      
      Toast.show({
        type: "error",
        text1: errorMessage,
        text2: errorMessage.includes("conectar") 
          ? "Verifique se o backend está rodando" 
          : "Verifique suas credenciais",
        position: "top",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Logo e Nome do App */}
        <View style={styles.header}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Blog Edc</Text>
        </View>

        {/* Card de Login */}
        <View style={styles.loginCard}>
          <LinearGradient
            colors={["#FF6B35", "#FF8A65"]}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Text style={styles.loginTitle}>Entrar</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor={APP_CONFIG.PRIMARY_COLOR}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="none"
                autoComplete="off"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Senha"
                  placeholderTextColor={APP_CONFIG.PRIMARY_COLOR}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="none"
                  autoComplete="off"
                  passwordRules=""
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <FontAwesome
                    name={showPassword ? "eye" : "eye-slash"}
                    size={20}
                    color={APP_CONFIG.PRIMARY_COLOR}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Botão de Login */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <LinearGradient
            colors={["#FF6B35", "#FF8A65"]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: APP_CONFIG.PRIMARY_COLOR,
  },
  loginCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    padding: 30,
    alignItems: "center",
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 30,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 14,
    paddingRight: 16,
  },
  loginButton: {
    width: "100%",
    maxWidth: 200,
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
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
