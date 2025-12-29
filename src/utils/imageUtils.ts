import { API_CONFIG } from "../constants/config";

/**
 * Constrói a URL completa da imagem a partir do caminho retornado pelo backend
 * @param imagePath - Caminho da imagem (pode ser URL completa, data URI base64, caminho relativo, ou caminho absoluto)
 * @returns URL completa da imagem, data URI, ou string vazia se não houver caminho
 */
export const buildImageUrl = (imagePath: string | undefined | null): string => {
  console.log("🔍 buildImageUrl - ENTRADA:", {
    imagePath: imagePath?.substring(0, 100),
    tipo: typeof imagePath,
    isNull: imagePath === null,
    isUndefined: imagePath === undefined,
  });

  if (!imagePath || typeof imagePath !== "string") {
    console.log("⚠️ buildImageUrl - Entrada inválida");
    return "";
  }

  const trimmedPath = imagePath.trim();
  
  if (!trimmedPath) {
    console.log("⚠️ buildImageUrl - String vazia após trim");
    return "";
  }

  // PRIMEIRA VERIFICAÇÃO: Se é um data URI (base64), retornar IMEDIATAMENTE
  // Verifica se começa com "data:" ou contém "data:image"
  // Esta verificação deve ser a PRIMEIRA para evitar qualquer processamento adicional
  const startsWithData = trimmedPath.startsWith("data:");
  const includesDataImage = trimmedPath.includes("data:image");
  
  console.log("🔍 buildImageUrl - Verificação data URI:", {
    startsWithData,
    includesDataImage,
    primeiroChar: trimmedPath[0],
    primeiros10Chars: trimmedPath.substring(0, 10),
  });

  if (startsWithData || includesDataImage) {
    console.log("✅ buildImageUrl - Data URI detectado, retornando diretamente");
    console.log("🔍 buildImageUrl - Primeiros 50 chars:", trimmedPath.substring(0, 50));
    return trimmedPath;
  }

  // Se já é uma URL completa (http ou https), retornar como está
  if (trimmedPath.includes("http://") || trimmedPath.includes("https://")) {
    return trimmedPath;
  }

  // Remover /api da URL base para construir a URL de uploads
  const baseURL = API_CONFIG.BASE_URL.replace("/api", "");

  // Se começa com /, usar diretamente
  if (trimmedPath.startsWith("/")) {
    return `${baseURL}${trimmedPath}`;
  }

  // Se já contém /uploads/, usar diretamente
  if (trimmedPath.includes("/uploads/")) {
    return `${baseURL}/${trimmedPath}`;
  }

  // Se começa com images/, adicionar /uploads/ antes
  if (trimmedPath.startsWith("images/")) {
    return `${baseURL}/uploads/${trimmedPath}`;
  }

  // Caso padrão: adicionar /uploads/ antes do caminho
  return `${baseURL}/uploads/${trimmedPath}`;
};

