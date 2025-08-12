# Padrões de Sistema: Criador de Produtos

## Arquitetura Geral
O Criador de Produtos segue uma arquitetura baseada em Next.js App Router, adotando o modelo de componentes React com separação entre componentes cliente e servidor. A aplicação utiliza Server Actions para operações de dados, seguindo um padrão semelhante ao MVC (Model-View-Controller).

## Padrões de Design
- **Componentes Atômicos**: Interface construída a partir de componentes reutilizáveis de baixo nível (botões, inputs, cards)
- **Component-Based Design**: Funcionalidades encapsuladas em componentes específicos e compostos
- **Server Components**: Utilização de componentes de servidor para renderização inicial
- **Client Components**: Utilização de componentes de cliente para interatividade
- **Server Actions**: Operações de dados realizadas através de ações do servidor seguras

## Estrutura do Sistema
\`\`\`mermaid
flowchart TD
    A[Página Inicial] --> B[Listagem de Produtos]
    A --> C[Criação de Produto]
    B --> D[Edição de Produto]
    B --> E[Exclusão de Produto]
    C --> F[Validação de Dados]
    D --> F
    F --> G[Server Actions]
    G --> H[Persistência]
\`\`\`

## Fluxos de Dados
\`\`\`mermaid
flowchart LR
    User[Usuário] --> FE[Interface]
    FE --> Form[Formulários]
    Form --> Validation[Validação]
    Validation --> Actions[Server Actions]
    Actions --> DB[Banco de Dados]
    DB --> Actions
    Actions --> FE
\`\`\`

## Decisões Arquitetônicas
### Utilização do Next.js App Router
- **Contexto**: Necessidade de uma arquitetura moderna e eficiente para a aplicação
- **Decisão**: Adotar o Next.js App Router em vez do Pages Router
- **Status**: Aceito
- **Consequências**: Melhor suporte para Server Components, melhor desempenho de carregamento, mas requer adaptação à nova abordagem

### Validação com Zod + React Hook Form
- **Contexto**: Necessidade de validação robusta de formulários
- **Decisão**: Utilizar Zod para schemas de validação e React Hook Form para gerenciamento de formulários
- **Status**: Aceito
- **Consequências**: Validação tipada, integração com TypeScript, código mais limpo e estruturado

### Server Actions para Operações de Dados
- **Contexto**: Necessidade de operações seguras no servidor
- **Decisão**: Utilizar Server Actions com next-safe-action
- **Status**: Aceito
- **Consequências**: Operações mais seguras, validação no servidor, melhor separação de responsabilidades

### Gestão de Código com GitHub
- **Contexto**: Necessidade de controle de versão e colaboração
- **Decisão**: Utilizar GitHub como repositório principal
- **Status**: Implementado
- **Consequências**: Melhor controle de versão, facilidade para colaboração, CI/CD potencial

## Componentes Principais
### ProdutoForm
- **Responsabilidade**: Gerenciar formulário de criação/edição de produtos
- **Interfaces**: Integração com React Hook Form, validação Zod, submissão para Server Actions
- **Dependências**: Server Actions, componentes UI

### ProdutosList
- **Responsabilidade**: Exibir e gerenciar lista de produtos
- **Interfaces**: Renderização de dados, interação para edição/exclusão
- **Dependências**: Server Actions, componentes UI

### Produto Actions
- **Responsabilidade**: Lógica de negócio para operações com produtos
- **Interfaces**: criarProduto, atualizarProduto, excluirProduto
- **Dependências**: Validação de dados, persistência

## Estrutura de Diretórios
```
├── app/
│   ├── api/
│   ├── criar/
│   └── page.tsx
├── components/
│   ├── ui/
│   └── produtos/
├── lib/
│   ├── schemas/
│   ├── actions/
│   └── utils/
└── public/
```
