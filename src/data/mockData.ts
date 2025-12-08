import { Post, User } from "../types";

// Dados mock para teste
export const mockUser: User = {
  id: "1",
  name: "João Silva",
  email: "joao@exemplo.com",
  role: "teacher",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

// Usuário admin mock
export const mockAdmin: User = {
  _id: "3",
  name: "Admin Sistema",
  email: "admin@exemplo.com",
  userType: "admin",
  school: "Escola Seu Manuel",
  age: 40,
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

export const mockPosts: Post[] = [
  {
    id: "1",
    title: "Verbo To Be",
    content:
      "Aqui você encontra conteúdos educativos de qualidade para aprender, revisar e se inspirar. Nosso objetivo é tornar o conhecimento acessível e prático, ajudando estudantes, professores e curiosos a expandir seus horizontes através de materiais didáticos bem estruturados e de fácil compreensão.",
    excerpt:
      "Aqui você encontra conteúdos educativos de qualidade para aprender, revisar e se inspirar. Nosso objetivo é tornar o conhecimento acessível e prático, ajudando estudantes, professores e curiosos a",
    author: mockUser,
    image:
      "https://via.placeholder.com/400x200/2C3E50/FFFFFF?text=Desktop+Setup",
    tags: ["Inglês", "Gramática", "Verbos"],
    likes: 50,
    comments: 50,
    isLiked: false,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Fundamentos de Programação",
    content:
      "A programação é uma habilidade essencial no mundo moderno. Vamos explorar os conceitos fundamentais...",
    excerpt:
      "Descubra os conceitos básicos da programação e como aplicá-los em diferentes linguagens.",
    author: mockUser,
    image: "https://via.placeholder.com/400x200/4CAF50/FFFFFF?text=Programming",
    tags: ["Programação", "Algoritmos", "Lógica"],
    likes: 23,
    comments: 12,
    isLiked: true,
    createdAt: "2024-01-14T14:30:00Z",
    updatedAt: "2024-01-14T14:30:00Z",
  },
  {
    id: "3",
    title: "Design de Interfaces Mobile",
    content:
      "O design de interfaces móveis requer atenção especial às limitações de espaço e interação...",
    excerpt:
      "Aprenda os princípios de design para criar interfaces móveis intuitivas e atraentes.",
    author: mockUser,
    image: "https://via.placeholder.com/400x200/2196F3/FFFFFF?text=UI+Design",
    tags: ["Design", "UX", "Mobile"],
    likes: 18,
    comments: 6,
    isLiked: false,
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
  },
  {
    id: "4",
    title: "Banco de Dados e APIs",
    content:
      "Entenda como trabalhar com bancos de dados e criar APIs robustas para suas aplicações...",
    excerpt:
      "Explore conceitos de banco de dados e desenvolvimento de APIs RESTful.",
    author: mockUser,
    image:
      "https://via.placeholder.com/400x200/FF9800/FFFFFF?text=Database+API",
    tags: ["Banco de Dados", "API", "Backend"],
    likes: 31,
    comments: 15,
    isLiked: true,
    createdAt: "2024-01-12T16:45:00Z",
    updatedAt: "2024-01-12T16:45:00Z",
  },
  {
    id: "5",
    title: "Testes em Aplicações Mobile",
    content:
      "Os testes são fundamentais para garantir a qualidade e estabilidade das aplicações móveis...",
    excerpt:
      "Aprenda estratégias e ferramentas para testar aplicações móveis de forma eficaz.",
    author: mockUser,
    image: "https://via.placeholder.com/400x200/9C27B0/FFFFFF?text=Testing",
    tags: ["Testes", "Qualidade", "Mobile"],
    likes: 12,
    comments: 4,
    isLiked: false,
    createdAt: "2024-01-11T11:20:00Z",
    updatedAt: "2024-01-11T11:20:00Z",
  },
];
