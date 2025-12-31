# Blog Educacional - App React Native

Aplicativo mobile desenvolvido em React Native (Expo) para a Fase 4 da pós-graduação em Full Stack Development, da FIAP.

O projeto foca em desenvolver o front-end mobile de uma aplicação de blogging, integrando-se com endpoints REST já existentes.

### Objetivo
Facilitar a comunicação entre professores e alunos da rede pública por meio de uma plataforma de blogging educacional via aplicativo mobile que permita a publicação e o acesso a conteúdos escolares, como textos e atividades.

### Público-alvo
Pessoas da rede pública de educação, mais especificamente dois agentes:
- **Alunos:** Podem visualizar, ler posts e interagir (curtir/comentar).
- **Professores/Administradores:** Podem criar, editar e excluir posts, e gerenciar a listagem e edição de outros usuários (Professores e Alunos).

### Equipe

| Nome                    | E-mail                           |
|-------------------------|-----------------------------------|
| Lucas Piran             | lucas13piran@gmail.com            |
| Felipe Ragne Silveira   | frsilveira01@outlook.com          |
| Lais Taine de Oliveira  | lais.taine@gmail.com              |
| Pedro Juliano Quimelo   | pedrojulianoquimelo@outlook.com   |


---

## Índice

1. [Tecnologias Utilizadas](#1.-tecnologias-utilizadas)
2. [Arquitetura da Aplicação](#arquitetura-da-aplicação)
3. [Setup Inicial e Configuração](#setup-inicial-e-configuração)
4. [Integração com o Back-end](#integração-com-o-back-end)
5. [Funcionalidades Implementadas](#funcionalidades-implementadas)
6. [Guia de Uso e Regras de Negócio](#guia-de-uso-e-regras-de-negocio)
7. [Layout e Design System](#layout-e-design-system)
8. [Relato de Experiências e Desafios Enfrentados](#relatos-de-experiências-e-desafios-enfrentados)  
9. [Considerações Finais](#considerações-finais)

---

# 1. Tecnologias Utilizadas

O projeto foi desenvolvido seguindo os requisitos técnicos para utilizar React Native com Hooks e Componentes Funcionais.

| Categoria      | Tecnologia                           | Versão  | Detalhe                                                                 |
|----------------|---------------------------------------|-----------------------------|-------------------------------------------------------------------------|
| Framework      | React Native + Expo                   | ~54.0.13 / 0.81.4           | Base do desenvolvimento cross-platform.                                |
| Linguagem      | TypeScript                            | ~5.9.2                      | Garante tipagem estática e segurança de código.                        |
| Roteamento     | Expo Router                           | ~6.0.11                     | Navegação nativa baseada em arquivos.                                  |
| Estado/Auth    | Context API                           | N/A                         | Gerenciamento de estado global de autenticação.                        |
| Persistência   | AsyncStorage                          | ^2.2.0                      | Armazenamento persistente do token JWT e dados do usuário.             |
| Estilização    | Inline/StyleSheet + LinearGradient    | ^15.0.7                     | Estilo de acordo com o layout definido (Tema Laranja/Branco). |

---

# 2. Arquitetura da Aplicação

## Estrutura de Pastas

```
blogedc/
├── app/                    # Camada de Rotas (Expo Router)
│   ├── (tabs)/             # Navegação principal por abas: Home, Usuários (Admin), Perfil
│   ├── login.tsx           # Tela de autenticação
│   ├── create-post.tsx     # Criação de novo post
│   ├── edit-user.tsx       # Edição de usuários
│   └── posts/[id].tsx      # Detalhes do post / Comentários
├── src/                    # Código-fonte principal
│   ├── components/         # Componentes Reutilizáveis
│   │   ├── common/         # (Ex: PostCard, CustomHeader, ProtectedRoute)
│   │   ├── ui/             # (Ex: Button, Input)
│   ├── services/           # Camada de Serviço (Comunicação com a API)
│   │   └── api.ts          # Arquivo central de integração REST
│   ├── contexts/           # Provedores de Estado Global (AuthContext)
│   ├── constants/          # Configurações globais (API_URL, Cores)
│   └── types/              # Definições de Tipos para TypeScript
└── hooks/                  # Hooks customizados
```


## Gerenciamento de Estado e Autenticação

- **Estado Local:** A maioria dos estados é gerenciada localmente usando Hooks (useState, useEffect).

- **Estado Global (Autenticação):** A autenticação é centralizada no AuthContext.tsx, que armazena o objeto user e o token JWT.

- **Persistência:** A sessão do usuário é persistida usando AsyncStorage. No entanto, o AuthContext.tsx força o logout (AsyncStorage.removeItem) na inicialização para garantir que o usuário sempre passe pela tela de login, conforme um fluxo de segurança recomendado.

- **Autorização:** O componente ProtectedRoute.tsx e a lógica de rotas em app/_layout.tsx controlam o acesso a telas restritas ((tabs), create-post, etc.), redirecionando para /login se não houver autenticação.

---
# 3. Setup Inicial e Configuração
 
## Pré-requisitos
1. Node.js (versão 20.19.4 ou superior, conforme react-native engines)

2. npm ou Yarn

3. Expo CLI (instalado globalmente)

## Configuração do Ambiente
O projeto requer que o endereço do backend esteja configurado em src/constants/config.ts:

```
//src/constants/config.ts

export const API_CONFIG = {
  // ATENÇÃO: Esta URL deve apontar para o seu backend REST Node.js
  BASE_URL: "https://backend-techchalenge.vercel.app/api", 
  TIMEOUT: 10000,
};

export const APP_CONFIG = {
  APP_NAME: "Blog Educacional",
  VERSION: "1.0.0",
  PRIMARY_COLOR: "#FF6B35", // Cor principal do tema
  SECONDARY_COLOR: "#FFFFFF",
};
```
### Instalação e execução
1. **Clone o repositório:**
```
git clone https://github.com/techchallenge-fiap-2025/blogedc
cd blogedc
```
2. **Instale as dependências:**
```
npm install
# ou
yarn install
```
3. **Execute a aplicação:**
```
npm start
# Opcional: npm run android / npm run ios / npm run web
```

---

# 4. Integração com o Back-end

A camada de serviços (src/services/api.ts) é responsável por todas as chamadas REST, incluindo a gestão de tokens para requisições protegidas.

| Serviço     | Métodos                   | URL              | Requisitos                                                                 |
|-------------|-----------------------------|-------------------------------------------------|------------------------------------------------------------------------------------|
| Auth        | POST                        | /users/login                                    | Login para professores.                                                             |
| Posts       | GET, POST, PUT, DELETE      | /posts                                          | Exibir posts e busca por palavras-chave; Criação/Edição/Exclusão.                  |
| Usuários    | GET, POST, PUT, DELETE      | /users e /users/:id                             | Listagem, criação, edição e exclusão de Professores e Alunos   |
| Comentários | POST, GET                   | /comments, /comments/post/:postId               | Permitir comentários nos posts (opcional).                                          |

---

# 5. Funcionalidades Implementadas

A tabela abaixo detalha a implementação dos requisitos solicitados com as telas implementadas.

| Tela/Rota            | Descrição da Funcionalidade                                                                                                                                     |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| /(tabs)/index.tsx    | **Página Principal:** Exibe lista de posts (título, autor, descrição) e inclui campo de busca para filtrar por palavras-chave.                                                                        |
| posts/[id].tsx       | **Página de Leitura:** Exibe o conteúdo completo do post e permite a seção de comentários e o botão de curtir.                                                                                        |
| create-post.tsx      | **Criação de Postagens:** Formulário para Título, Conteúdo/Descrição e upload de imagem. Acesso pelo FAB (Floating Action Button) visível na Home.                                                    |
| edit-post.tsx        | **Edição de Postagens:** Carrega dados do post selecionado para edição (título, descrição, imagem). Botão para salvar alterações.                                                                      |
| add-user.tsx         | **Criação de Professores e Alunos:** Formulário unificado com campos condicionais para Professores (Matérias) e Alunos (Turma, Responsável).                                                           |
| edit-user.tsx        | **Edição de Professores e Alunos:** Carrega dados para edição, permitindo salvar alterações em campos comuns e específicos.                                                                            |
| /(tabs)/two.tsx      | **Listagem/Administrativa:** Tela visível apenas para Admins. Lista paginada de todos os usuários com botões de Editar e Excluir.                                                                      |
| /(tabs)/two.tsx      | **Página Administrativa:** Concentra o acesso à gestão de usuários. A edição e exclusão de posts são feitas nas respectivas telas de detalhe (`posts/[id].tsx`).                                       |
| login.tsx            | **Autenticação:** Login via e-mail e senha, garantindo a autorização baseada no tipo de usuário (Professor/Aluno) para acesso a funcionalidades restritas.                                             |

---

# 6. Guia de Uso e Regras de Negócio
### Fluxo de Autenticação e Autorização.
O controle de acesso é baseado no campo userType (aluno, professor, admin) e nas regras de negócio:

| Ação                       | Aluno (aluno)   | Professor/Admin (professor/admin)                     | Arquivo de Controle                               |
|---------------------------|-----------------|--------------------------------------------------------|---------------------------------------------------|
| Visualizar Posts          | ✅ Completo      | ✅ Completo                                             | app/(tabs)/index.tsx                              |
| Criar Posts               | ❌ Negado       | ✅ Permitido                                            | app/(tabs)/_layout.tsx (FAB e rota)               |
| Editar/Excluir Posts      | ❌ Negado       | ✅ Permitido (apenas posts próprios)                    | app/posts/[id].tsx (lógica `isOwner`)             |
| Acesso à Gestão de Usuários | ❌ Negado     | ✅ Permitido (apenas admin visualiza a aba)             | app/(tabs)/two.tsx                                |


### Fluxo do Usuário (Guia de Uso)
1. **Acesso:** O usuário é forçado a passar pela tela de login (/login) devido à lógica de desautenticação na inicialização do app.

2. **Visualização:** Após o login, o usuário é direcionado para a tela Home (Aba index) que lista todos os posts com função de busca.

3. **Interação (Aluno):** O aluno pode tocar em qualquer post para ver o conteúdo completo (posts/[id].tsx), curtir e adicionar comentários..tsx]

4. **Criação (Professor/Admin):** Na tela inicial (index), o Professor/Admin vê um botão flutuante "+" para acessar a tela create-post.tsx.

5. **Administração (Admin):** Usuários com userType: 'admin' acessam a aba Usuários (/two) para realizar CRUD de Professores e Alunos.
   
---

# 7. Layout e Design System

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

---

# 8. Relato de Experiências e Desafios Enfrentados

## Metodologia de Trabalho
Para fins de aprendizado, todo integrante da equipe se propôs a produzir sua própria interface individual para então decidir por aquela mais apropriada, seguindo os critérios de avaliação. Após a apresentação individual, um projeto é escolhido e aprimorado em conjunto, com divisões de tarefas por aptidão.

## Desafios Técnicos
Durante o desenvolvimento, a equipe enfrentou desafios como:

- Estruturar rotas com Expo Router
- Criar CRUDs completos para três entidades
- Tratar erros de API
- Organizar UI e garantir consistência visual

## Aprendizados principais:

- Melhores práticas com React Native + Expo
- Controle de estado global com Context API
- Integração front-end + back-end
- Reuso de componentes
- Boas práticas de organização de pastas

## Próximos Passos

- [ ] Implementar autenticação completa
- [ ] Criar sistema de notificações
- [ ] Adicionar modo offline
- [ ] Testes unitários
   
---
# 9. Considerações Finais

O projeto possibilitou aplicar os conceitos aprendidos na Fase 4 - Mobile, da pós Tech Full Stack Development, da FIAP, unindo teoria e prática.

O processo colaborativo e o uso de ferramentas de apoio foram fundamentais para superar desafios técnicos e entregar uma solução funcional e com propósito social.

## Contatos
lucas13piran@gmail.com
frsilveira01@outlook.com
lais.taine@gmail.com
pedrojulianoquimelo@outlook.com

---


## 📄 Licença

Este projeto é parte de um desafio técnico educacional.
