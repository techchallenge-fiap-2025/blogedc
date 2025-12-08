# Blog Educacional - App React Native

Um aplicativo móvel educacional desenvolvido em React Native com Expo, conectado a um backend Node.js.

## 🚀 Funcionalidades

- **Splash Screen Personalizada**: Tela de carregamento com design educacional
- **Feed de Posts**: Visualização de posts educacionais com curtidas e comentários
- **Filtros**: Posts organizados por popularidade e recência
- **Perfil do Usuário**: Gerenciamento de perfil e estatísticas
- **Interface Moderna**: Design limpo e intuitivo com tema laranja

## 📱 Telas

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

## 🛠 Tecnologias

- **React Native** com Expo
- **TypeScript** para tipagem
- **Expo Router** para navegação
- **React Native SVG** para ícones customizados
- **Expo Linear Gradient** para gradientes
- **FontAwesome** para ícones

## 📁 Estrutura do Projeto

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
