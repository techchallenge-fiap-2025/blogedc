import { API_CONFIG } from "../constants/config";
import { mockPosts } from "../data/mockData";

// Serviço para autenticação
export class AuthService {
  private static baseURL = API_CONFIG.BASE_URL;

  static async login(email: string, password: string) {
    try {
      const response = await fetch(`${this.baseURL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Credenciais inválidas");
      }

      return data;
    } catch (error) {
      console.log("Erro no login:", error);
      throw error;
    }
  }

  static async register(userData: {
    name: string;
    email: string;
    password: string;
    role: "student" | "teacher";
  }) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar conta");
      }

      return await response.json();
    } catch (error) {
      // Retornar dados mock em caso de erro de rede
      console.log("Usando dados mock para registro");
      return {
        user: { id: "1", ...userData },
        token: "mock-token",
      };
    }
  }

  static async logout() {
    // Implementar logout
  }
}

// Serviço para posts
export class PostService {
  private static baseURL = API_CONFIG.BASE_URL;

  static async getPosts(page = 1, limit = 1000, token?: string, search?: string) {
    try {
      console.log("🔍 PostService.getPosts: Iniciando carregamento");
      console.log("🔍 PostService.getPosts: page:", page, "limit:", limit, "search:", search);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Usar a URL base configurada
      const baseURL = this.baseURL;
      let url = `${baseURL}/posts?page=${page}&limit=${limit}`;
      
      // Adicionar parâmetro de busca se fornecido
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      
      console.log("🔍 PostService.getPosts: URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      console.log("🔍 PostService.getPosts: Response status:", response.status);
      console.log("🔍 PostService.getPosts: Response ok:", response.ok);

      let data;
      try {
        data = await response.json();
        console.log("🔍 PostService.getPosts: Response data:", data);
      } catch (parseError) {
        console.error("❌ PostService.getPosts: Erro ao parsear JSON:", parseError);
        throw new Error("Erro ao processar resposta do servidor");
      }

      if (!response.ok || !data.success) {
        const errorMessage = data.message || "Erro ao carregar posts";
        console.error("❌ PostService.getPosts: Erro do servidor:", errorMessage);
        throw new Error(errorMessage);
      }

      // Transformar posts do backend para o formato esperado
      const transformedPosts = (data.data || []).map((post: any) => {
        // Transformar autor para garantir que tenha _id
        const authorData = post.author || {};
        const transformedAuthor = {
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
          isActive:
            authorData.isActive !== undefined ? authorData.isActive : true,
          createdAt: authorData.createdAt || "",
          updatedAt: authorData.updatedAt || "",
        };

        return {
          id: post._id || post.id,
          title: post.title,
          content: post.content || post.excerpt || "",
          excerpt: post.excerpt || post.content?.substring(0, 150) || "",
          author: transformedAuthor,
          imageSrc: post.imageSrc || post.image || "",
          tags: post.tags || [],
          likes: post.likes || post.likesCount || 0,
          comments: post.comments || post.commentsCount || 0,
          isLiked: post.userLiked || false,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      });

      console.log(`✅ PostService.getPosts: ${transformedPosts.length} posts carregados com sucesso do banco de dados`);
      return { posts: transformedPosts };
    } catch (error: any) {
      console.error("❌ PostService.getPosts: Erro completo:", error);
      // Não usar mock - lançar erro para ser tratado pela tela
      throw error;
    }
  }

  static async getPostById(id: string, token?: string) {
    try {
      // Validar ID antes de fazer a requisição
      if (!id || id.trim() === "") {
        throw new Error("ID do post inválido");
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Usar a URL base configurada
      const baseURL = this.baseURL;

      console.log("🔍 Buscando post:", id);
      console.log("🔍 URL:", `${baseURL}/posts/${id}`);

      const response = await fetch(`${baseURL}/posts/${id}`, {
        method: "GET",
        headers,
      });

      console.log("🔍 Response status:", response.status);
      console.log("🔍 Response ok:", response.ok);

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("❌ Erro ao parsear resposta:", parseError);
        throw new Error("Erro ao processar resposta do servidor");
      }

      if (!response.ok || !data.success) {
        const errorMessage =
          data.message || data.error || "Post não encontrado";
        console.error("❌ Erro do servidor:", errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.data) {
        throw new Error("Post não encontrado");
      }

      console.log("✅ Post encontrado:", data.data.title);
      return { post: data.data };
    } catch (error: any) {
      console.error("❌ Erro ao buscar post:", error);
      // Retornar dados mock em caso de erro de rede (apenas para desenvolvimento)
      console.log("⚠️ Usando dados mock para post específico");
      const post = mockPosts.find((p) => p.id === id);
      if (!post) {
        throw error; // Re-throw o erro original se não encontrar mock
      }
      return { post };
    }
  }

  static async createPost(
    postData: {
      title: string;
      excerpt: string;
      content: string;
      imageSrc?: string;
      tags?: string[];
    },
    token: string
  ) {
    try {
      console.log("🔍 PostService.createPost: Iniciando criação de post");
      console.log("🔍 PostService.createPost: Dados:", postData);

      // Usar a URL base configurada
      const baseURL = this.baseURL;

      const response = await fetch(`${baseURL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      console.log(
        "🔍 PostService.createPost: Response status:",
        response.status
      );
      console.log("🔍 PostService.createPost: Response ok:", response.ok);

      const data = await response.json();
      console.log("🔍 PostService.createPost: Response data:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Erro ao criar post");
      }

      console.log("✅ PostService.createPost: Post criado com sucesso");
      return data;
    } catch (error: any) {
      console.log("❌ PostService.createPost: Erro:", error);

      // Melhorar mensagem de erro para problemas de rede
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("Failed to fetch") ||
        error instanceof TypeError
      ) {
        throw new Error(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
        );
      }

      throw error;
    }
  }

  static async createPostWithImage(formData: FormData, token: string) {
    try {
      console.log(
        "🔍 PostService.createPostWithImage: Iniciando criação de post com imagem"
      );

      // Usar a URL base configurada
      const baseURL = this.baseURL;

      const response = await fetch(`${baseURL}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Não definir Content-Type para FormData - o browser define automaticamente
        },
        body: formData,
      });

      console.log(
        "🔍 PostService.createPostWithImage: Response status:",
        response.status
      );
      console.log(
        "🔍 PostService.createPostWithImage: Response ok:",
        response.ok
      );

      let data;
      try {
        data = await response.json();
        console.log("🔍 PostService.createPostWithImage: Response data:", data);
      } catch (parseError) {
        console.error("❌ Erro ao parsear resposta:", parseError);
        const responseText = await response.text();
        console.error("❌ Response text:", responseText);
        throw new Error("Erro ao processar resposta do servidor");
      }

      if (!response.ok || !data.success) {
        // Se houver erros de validação, incluir na mensagem
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const errorMessages = data.errors.map((err: any) => err.msg || err.message).join(", ");
          throw new Error(errorMessages || data.message || "Erro ao criar post");
        }
        throw new Error(data.message || "Erro ao criar post");
      }

      console.log(
        "✅ PostService.createPostWithImage: Post criado com sucesso"
      );
      return data;
    } catch (error: any) {
      console.log("❌ PostService.createPostWithImage: Erro:", error);

      // Melhorar mensagem de erro para problemas de rede
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("Failed to fetch") ||
        error instanceof TypeError
      ) {
        throw new Error(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
        );
      }

      throw error;
    }
  }

  static async getUserPosts(
    userId: string,
    token: string,
    page = 1,
    limit = 10
  ) {
    try {
      console.log("🔍 Buscando posts do usuário:", userId);

      // Usar a URL base configurada
      const baseURL = this.baseURL;

      const response = await fetch(
        `${baseURL}/posts/user/${userId}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("🔍 Response status:", response.status);
      console.log("🔍 Response ok:", response.ok);

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage =
          data.message || data.error || "Erro ao carregar posts do usuário";
        console.error("❌ Erro do servidor:", errorMessage);
        throw new Error(errorMessage);
      }

      console.log("✅ Posts do usuário carregados:", data.data?.length || 0);

      // Transformar posts do backend
      const transformedPosts = (data.data || []).map((post: any) => ({
        _id: post._id || post.id,
        id: post._id || post.id,
        title: post.title,
        content: post.content || post.excerpt || "",
        excerpt: post.excerpt || post.content?.substring(0, 150) || "",
        imageSrc: post.imageSrc || post.image || "",
        likes: post.likes || 0,
        comments: post.comments || 0,
        tags: post.tags || [],
        isLiked: post.userLiked || false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }));

      return { posts: transformedPosts };
    } catch (error) {
      console.error("❌ Erro ao carregar posts do usuário:", error);
      return { posts: [] };
    }
  }

  static async likePost(postId: string, token: string) {
    try {
      console.log("🔍 PostService.likePost - PostId:", postId);

      // Usar a URL base configurada
      const baseURL = this.baseURL;

      // Tentar PUT primeiro (padrão), se falhar, tentar POST
      let response = await fetch(`${baseURL}/posts/${postId}/like`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Se PUT não funcionar, tentar POST
      if (!response.ok && response.status === 404) {
        console.log("⚠️ PUT não encontrado, tentando POST");
        response = await fetch(`${baseURL}/posts/${postId}/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Erro ao curtir post");
      }

      console.log("✅ PostService.likePost - Resposta:", data);
      return data;
    } catch (error) {
      console.error("❌ Erro ao curtir post:", error);
      throw error;
    }
  }

  static async deletePost(postId: string, token: string) {
    try {
      console.log("🔍 PostService.deletePost - PostId:", postId);

      // Usar a URL base configurada
      const baseURL = this.baseURL;

      const response = await fetch(`${baseURL}/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Erro ao deletar post");
      }

      console.log("✅ PostService.deletePost - Post deletado com sucesso");
      return data;
    } catch (error) {
      console.error("❌ Erro ao deletar post:", error);
      throw error;
    }
  }

  static async updatePostWithImage(
    formData: FormData,
    postId: string,
    token: string
  ) {
    try {
      // Usar a URL base configurada
      const baseURL = this.baseURL;

      const response = await fetch(`${baseURL}/posts/${postId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Não definir Content-Type manualmente - o browser/formData faz isso automaticamente
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Erro ao atualizar post");
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
}

// Serviço para comentários
export class CommentService {
  private static baseURL = API_CONFIG.BASE_URL;

  static async getComments(postId: string, token?: string) {
    try {
      // Validar postId antes de fazer a requisição
      if (!postId || postId.trim() === "") {
        console.warn("⚠️ PostId inválido para buscar comentários");
        return {
          comments: [],
          pagination: {},
        };
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Usar a URL base configurada
      const baseURL = this.baseURL;

      console.log("🔍 Buscando comentários para post:", postId);
      console.log("🔍 URL:", `${baseURL}/comments/post/${postId}`);

      const response = await fetch(`${baseURL}/comments/post/${postId}`, {
        method: "GET",
        headers,
      });

      console.log("🔍 Response status:", response.status);
      console.log("🔍 Response ok:", response.ok);

      // Tentar ler a resposta mesmo em caso de erro
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("❌ Erro ao parsear resposta:", parseError);
        return {
          comments: [],
          pagination: {},
        };
      }

      if (!response.ok || !data.success) {
        const errorMessage =
          data.message || data.error || "Erro ao carregar comentários";
        console.warn("⚠️ Erro ao buscar comentários:", errorMessage);
        // Retornar array vazio em vez de lançar erro
        return {
          comments: [],
          pagination: {},
        };
      }

      console.log("✅ Comentários carregados:", data.data?.length || 0);
      return {
        comments: data.data || [],
        pagination: data.pagination || {},
      };
    } catch (error: any) {
      console.error("❌ Erro ao carregar comentários:", error);
      // Retornar array vazio em caso de erro para não quebrar a UI
      return {
        comments: [],
        pagination: {},
      };
    }
  }

  static async createComment(postId: string, content: string, token: string) {
    try {
      // Usar a URL base configurada
      const baseURL = this.baseURL;

      console.log("🔍 Criando comentário:", {
        postId,
        content: content.substring(0, 50),
      });
      console.log("🔍 URL:", `${baseURL}/comments`);

      const response = await fetch(`${baseURL}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, postId }),
      });

      console.log("🔍 Response status:", response.status);
      console.log("🔍 Response ok:", response.ok);

      // Tentar ler a resposta mesmo em caso de erro
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Erro ao processar resposta: ${response.statusText}`);
      }

      if (!response.ok || !data.success) {
        const errorMessage =
          data.message || data.error || "Erro ao criar comentário";
        console.error("❌ Erro do servidor:", errorMessage);
        throw new Error(errorMessage);
      }

      console.log("✅ Comentário criado com sucesso");
      return data;
    } catch (error: any) {
      console.error("❌ Erro ao criar comentário:", error);

      // Melhorar mensagem de erro para o usuário
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("Failed to fetch")
      ) {
        throw new Error(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
        );
      }

      throw error;
    }
  }

  static async likeComment(commentId: string, token: string) {
    try {
      // Usar a URL base configurada
      const baseURL = this.baseURL;

      const response = await fetch(`${baseURL}/comments/${commentId}/like`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Erro ao curtir comentário");
      }

      return data;
    } catch (error) {
      console.error("Erro ao curtir comentário:", error);
      throw error;
    }
  }
}

// Serviço para usuários
export class UserService {
  private static baseURL = API_CONFIG.BASE_URL;

  static async getUserById(userId: string, token: string) {
    try {
      console.log("🔍 Buscando usuário por ID:", userId);

      // Usar a URL base configurada
      const baseURL = this.baseURL;

      const response = await fetch(`${baseURL}/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("🔍 Response status:", response.status);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Erro ao buscar usuário");
      }

      console.log("✅ Usuário encontrado:", data.data.name);
      return { user: data.data };
    } catch (error) {
      console.error("❌ Erro ao buscar usuário:", error);
      throw error;
    }
  }

  static async deleteUser(userId: string, token: string) {
    try {
      console.log("🔍 UserService.deleteUser: Iniciando exclusão");
      console.log("🔍 UserService.deleteUser: userId:", userId);

      // Usar a URL base configurada
      const baseURL = this.baseURL;
      const url = `${baseURL}/users/${userId}`;
      console.log("🔍 UserService.deleteUser: URL:", url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("🔍 UserService.deleteUser: Response status:", response.status);
      console.log("🔍 UserService.deleteUser: Response ok:", response.ok);

      let data;
      try {
        data = await response.json();
        console.log("🔍 UserService.deleteUser: Response data:", data);
      } catch (parseError) {
        console.error("❌ UserService.deleteUser: Erro ao parsear JSON:", parseError);
        throw new Error("Erro ao processar resposta do servidor");
      }

      if (!response.ok || !data.success) {
        const errorMessage = data.message || "Erro ao deletar usuário";
        console.error("❌ UserService.deleteUser: Erro do servidor:", errorMessage);
        throw new Error(errorMessage);
      }

      console.log("✅ UserService.deleteUser: Usuário deletado com sucesso");
      return data;
    } catch (error: any) {
      console.error("❌ UserService.deleteUser: Erro completo:", error);
      throw error;
    }
  }

  static async getAllUsers(token: string, page = 1, limit = 1000) {
    try {
      console.log("🔍 UserService.getAllUsers: Iniciando chamada");
      
      // Usar a URL base configurada
      const baseURL = this.baseURL;
      
      console.log(
        "🔍 UserService.getAllUsers: URL:",
        `${baseURL}/users?page=${page}&limit=${limit}`
      );
      console.log(
        "🔍 UserService.getAllUsers: Token:",
        token?.substring(0, 20) + "..."
      );

      const response = await fetch(
        `${baseURL}/users?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "🔍 UserService.getAllUsers: Response status:",
        response.status
      );
      console.log("🔍 UserService.getAllUsers: Response ok:", response.ok);

      const data = await response.json();
      console.log("🔍 UserService.getAllUsers: Response data:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Erro ao carregar usuários");
      }

      console.log("✅ UserService.getAllUsers: Sucesso, retornando dados");
      console.log(`✅ Total de usuários carregados: ${data.data?.length || 0}`);
      return { users: data.data || [], pagination: data.pagination };
    } catch (error) {
      console.log("❌ UserService.getAllUsers: Erro:", error);
      throw error;
    }
  }

  static async updateUser(userId: string, userData: any, token: string) {
    try {
      console.log("🔍 UserService.updateUser: Iniciando atualização");
      console.log("🔍 UserService.updateUser: userId:", userId);

      // Usar a URL base configurada
      const baseURL = this.baseURL;
      const url = `${baseURL}/users/${userId}`;
      console.log("🔍 UserService.updateUser: URL:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      console.log("🔍 UserService.updateUser: Response status:", response.status);
      console.log("🔍 UserService.updateUser: Response ok:", response.ok);

      let data;
      try {
        data = await response.json();
        console.log("🔍 UserService.updateUser: Response data:", data);
      } catch (parseError) {
        console.error("❌ UserService.updateUser: Erro ao parsear JSON:", parseError);
        throw new Error("Erro ao processar resposta do servidor");
      }

      if (!response.ok || !data.success) {
        const errorMessage = data.message || data.error || "Erro ao atualizar usuário";
        console.error("❌ UserService.updateUser: Erro do servidor:", errorMessage);
        throw new Error(errorMessage);
      }

      console.log("✅ UserService.updateUser: Usuário atualizado com sucesso");
      return data;
    } catch (error: any) {
      console.error("❌ UserService.updateUser: Erro completo:", error);
      throw error;
    }
  }
}
