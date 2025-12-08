// Tipos para o usuário
export interface User {
  _id: string;
  name: string;
  email: string;
  userType: "professor" | "aluno" | "admin";
  school: string;
  age: number;
  profileImage?: string;
  subjects?: string[];
  class?: string;
  guardian?: string[]; // Array de responsáveis (1 ou 2)
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para posts
export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: User;
  imageSrc: string; // URL da imagem salva no backend
  image?: string; // legado (remover quando não for mais usado)
  tags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos para comentários
export interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos para autenticação
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Tipos para navegação
export type RootStackParamList = {
  "(tabs)": undefined;
  "auth/login": undefined;
  "auth/register": undefined;
  "posts/[id]": { id: string };
  "profile/edit": undefined;
};

export type TabParamList = {
  home: undefined;
  posts: undefined;
  profile: undefined;
};
