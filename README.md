# Blog Educacional - App React Native

Aplicativo mobile desenvolvido em React Native (Expo) para a Fase 4 da pós-graduação em Full Stack Development, da FIAP.

O app oferece uma interface para alunos e professores interagirem com a plataforma de blogging, consumindo o backend REST em Node.js.

-**Alunos:** podem visualizar e ler posts.
-**Professores:** podem criar, editar e excluir posts, professores e alunos.
-**Administrador (professor):** possui acesso às telas de gestão.

---

## 📌 Índice

- [Sobre o Projeto](#sobre-o-projeto)  
- [Tecnologias Utilizadas](#tecnologias-utilizadas)  
- [Arquitetura do Projeto](#arquitetura-do-projeto)
- [Funcionalidades](#funcionalidades)  
- [Instalação e Execução](#instalação-e-execução)  
- [Funcionalidades](#funcionalidades)  
- [Fluxo de Autenticação](#fluxo-de-autenticação)  
- [Integração com o Back-end](#integração-com-o-back-end)  
- [Guia de Uso](#guia-de-uso)  
- [Desafios e Aprendizados](#desafios-e-aprendizados)  
- [Equipe](#equipe)

---

# Sobre o Projeto

O **BlogEDC Mobile** é a versão mobile da plataforma de blogging desenvolvida no Tech Challenge da Fase 4.  
O app oferece uma interface limpa e responsiva para acessar, criar e administrar conteúdo, seguindo regras de autenticação e autorização definidas no backend.

Para isso, utiliza **Expo Router**, Context API e componentes reutilizáveis.

---

# Tecnologias Utilizadas

- **React Native + Expo**
- **TypeScript**
- **Expo Router**
- **Context API**
- **AsyncStorage**
- **Axios / Fetch API**
- **React Native Reanimated**
- **Expo Vector Icons**
- **React Native Screens / Safe Area Context**

---

# Arquitetura do Projeto

A estrutura abaixo reflete o código real entregue:

```
blogedc/
├── app/                    # Rotas do Expo Router
│   ├── (tabs)/            # Abas principais
│   │   ├── index.tsx      # Tela inicial
│   │   ├── two.tsx        # Tela de posts
│   │   ├── profile.tsx    # Tela de perfil
│   │   └── _layout.tsx    # Layout das abas
│   └── _layout.tsx        # Layout principal
├── src/                   # Código fonte organizado
│   ├── components/        # Componentes reutilizáveis
│   │   ├── common/        # Componentes comuns
│   │   └── ui/            # Componentes de UI
│   ├── services/          # Serviços de API
│   ├── types/             # Definições de tipos
│   ├── constants/         # Constantes do app
│   └── utils/             # Utilitários
├── components/            # Componentes globais
│   └── SplashScreen.tsx   # Splash screen customizada
└── hooks/                 # Hooks customizados
    └── useSplashScreen.ts # Hook da splash screen
```

--- 

# Funcionalidades

## Home (index.tsx)

- Listagem de posts

- Busca por palavra-chave

- Navegação para detalhes

## Posts
/posts/index.tsx
- Lista todos os posts

/posts/[id].tsx

- Exibe detalhes: título, autor e conteúdo

/posts/create.tsx

- Criar post (somente professores)

/posts/edit/[id].tsx

- Editar post (somente professores)

/admin/posts.tsx

- Excluir posts

- Edição e administração geral

## Professores
/professors/index.tsx

- Listagem

- Botões de editar e excluir

/professors/create.tsx

- Formulário de cadastro

/professors/edit/[id].tsx

- Edição completa

### Endpoints usados:
GET /teachers  
POST /teachers  
PUT /teachers/:id  
DELETE /teachers/:id

## Alunos
/students/index.tsx

- Listagem

/students/create.tsx

- Cadastro de aluno

/students/edit/[id].tsx

- Editor de aluno

### Endpoints usados:

GET /students  
POST /students  
PUT /students/:id  
DELETE /students/:id

## Diferenciais de Telas

- **Splash Screen Personalizada**: Tela de carregamento com design educacional
- **Feed de Posts**: Visualização de posts educacionais com curtidas e comentários
- **Filtros**: Posts organizados por popularidade e recência
- **Perfil do Usuário**: Gerenciamento de perfil e estatísticas
- **Interface Moderna**: Design limpo e intuitivo com tema laranja

### 1. Splash Screen

- Ícone de educação (livro com capelo)
- Círculo laranja decorativo
- Transição suave para o app

### 2. Tela Inicial

- Feed principal com posts educacionais
- Pull-to-refresh
- Curtidas e comentários interativos

### 3. Tela de Posts

- Lista filtrada de posts
- Filtros: Todos, Populares, Recentes
- Navegação intuitiva

### 4. Tela de Perfil

- Informações do usuário
- Estatísticas (posts e curtidas)
- Configurações do app
  

---

# Fluxo de Autenticação

A autenticação é gerenciada por AuthContext.tsx, que controla:

- estado de login

- token JWT

- role (aluno ou professor)

- persistência da sessão via AsyncStorage

- logout

- redirecionamento de rotas protegidas

O componente `ProtectedRoute.tsx` impede acesso não autorizado a rotas internas.

---

# Integração com o Back-end

Toda comunicação com a API é feita via services/api.ts.

## Ele é responsável por:

- Configurar baseURL

- Adicionar token no header (quando disponível)

- Tratar erros de requisição

- Expor funções para:

    - posts

    - alunos

    - professores

    - autenticação

A aplicação usa backend real com autenticação via token JWT.

---

# Guia de Uso

## Aluno

1. Fazer login

2. Ver posts

3. Buscar posts

4. Abrir posts para leitura

## Professor

1. Fazer login

2. Criar posts

3. Editar posts

4. Excluir posts

5. Gerenciar alunos

6. Gerenciar professores

7. Acessar área administrativa

---

# Instalação e Execução

## Clone o repositório:

```
git clone https://github.com/techchallenge-fiap-2025/blogedc
cd blogedc
```


## Instale as dependências
```
npm install
```

## Execute o app
```
npm start
```


Ou:
```
npm run android
npm run ios
npm run web
```

## 🎨 Design System

### Cores

- **Primária**: #FF6B35 (Laranja)
- **Secundária**: #FFFFFF (Branco)
- **Texto**: #333333 (Cinza escuro)
- **Fundo**: #F5F5F5 (Cinza claro)

### Componentes

- **Button**: Botões com variantes (primary, secondary, outline)
- **Input**: Campos de entrada com validação
- **PostCard**: Card para exibição de posts
- **SplashScreen**: Tela de carregamento customizada

## 🔧 Configuração

1. **Instalar dependências**:

   ```bash
   npm install
   ```

2. **Configurar backend**:

   - Atualizar `API_CONFIG.BASE_URL` em `src/constants/config.ts`
   - Certificar que o backend está rodando

3. **Executar o app**:
   ```bash
   npm start
   ```

## 📡 Integração com Backend

O app está configurado para se conectar com o backend Node.js localizado em `backend-techchalenge/`. As principais integrações incluem:

- **Autenticação**: Login e registro de usuários
- **Posts**: CRUD de posts educacionais
- **Comentários**: Sistema de comentários
- **Curtidas**: Sistema de curtidas

## 🚀 Próximos Passos

- [ ] Implementar autenticação completa
- [ ] Adicionar upload de imagens
- [ ] Criar sistema de notificações
- [ ] Implementar busca de posts
- [ ] Adicionar modo offline
- [ ] Testes unitários

## 📄 Licença

Este projeto é parte de um desafio técnico educacional.
